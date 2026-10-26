import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { UserMenu } from "../UserMenu";
import { InstallBanner } from "./InstallBanner";
import { resetInstallForTests } from "./install";
import {
  countTranslation,
  NUDGE_AFTER,
  resetNudgeForTests,
  shouldNudge,
} from "./nudge";

vi.mock("@/ui/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: { user: { name: "Paolo", email: "p@test.dev", image: null } },
    }),
    signOut: vi.fn(),
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPHONE_WEBVIEW =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const DESKTOP_FIREFOX =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:130.0) Gecko/20100101 Firefox/130.0";

const realMatchMedia = window.matchMedia;

/** Pretends to be a given browser, installed (standalone) or not. */
function browse(userAgent: string, { standalone = false } = {}) {
  Object.defineProperty(navigator, "userAgent", {
    value: userAgent,
    configurable: true,
  });
  Object.defineProperty(navigator, "maxTouchPoints", {
    value: /iPhone|Android/.test(userAgent) ? 5 : 0,
    configurable: true,
  });
  window.matchMedia = ((query: string) => ({
    ...realMatchMedia(query),
    matches: standalone && query.includes("standalone"),
  })) as typeof window.matchMedia;
}

function offerInstall() {
  const prompt = vi.fn(async () => {});
  const event = Object.assign(
    new Event("beforeinstallprompt", { cancelable: true }),
    {
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    },
  );
  act(() => {
    window.dispatchEvent(event);
  });
  return { prompt, event };
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        usedToday: 0,
        dailyLimit: 50,
        resetAt: "2026-10-11T00:00:00.000Z",
      }),
    ),
  );
  resetInstallForTests();
  resetNudgeForTests();
});
afterEach(() => {
  window.matchMedia = realMatchMedia;
  vi.unstubAllGlobals();
});

const openMenu = async () =>
  userEvent.click(await screen.findByRole("button", { name: /account menu/i }));

describe("shouldNudge", () => {
  const base = {
    kind: "ios" as const,
    translations: NUDGE_AFTER,
    dismissedAt: null,
    now: 1_000_000_000_000,
  };

  it("waits until the user has translated a few phrases", () => {
    expect(shouldNudge({ ...base, translations: NUDGE_AFTER - 1 })).toBe(false);
    expect(shouldNudge(base)).toBe(true);
  });

  it("never shows when there is nothing to install", () => {
    expect(shouldNudge({ ...base, kind: null })).toBe(false);
  });

  it("stays away for a month after being dismissed, then asks again", () => {
    const day = 24 * 60 * 60 * 1000;
    expect(shouldNudge({ ...base, dismissedAt: base.now - 29 * day })).toBe(
      false,
    );
    expect(shouldNudge({ ...base, dismissedAt: base.now - 31 * day })).toBe(
      true,
    );
  });
});

describe("the Install app menu item", () => {
  it("is offered on iOS Safari and opens the step-by-step guide", async () => {
    browse(IPHONE_SAFARI);
    renderWithProviders(<UserMenu />);
    await openMenu();

    await userEvent.click(
      await screen.findByRole("menuitem", { name: /install app/i }),
    );

    expect(
      await screen.findByText(/add to home screen/i, { selector: "strong" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/open in safari/i)).not.toBeInTheDocument();
  });

  it("starts the guide with leaving the app's own browser", async () => {
    browse(IPHONE_WEBVIEW);
    renderWithProviders(<UserMenu />);
    await openMenu();

    await userEvent.click(
      await screen.findByRole("menuitem", { name: /install app/i }),
    );

    expect(await screen.findByText(/open in safari/i)).toBeInTheDocument();
  });

  it("is hidden inside the installed app", async () => {
    browse(IPHONE_SAFARI, { standalone: true });
    renderWithProviders(<UserMenu />);
    await openMenu();

    await screen.findByRole("menuitem", { name: /sign out/i });
    expect(
      screen.queryByRole("menuitem", { name: /install app/i }),
    ).not.toBeInTheDocument();
  });

  it("is hidden in a browser that cannot install it", async () => {
    browse(DESKTOP_FIREFOX);
    renderWithProviders(<UserMenu />);
    await openMenu();

    await screen.findByRole("menuitem", { name: /sign out/i });
    expect(
      screen.queryByRole("menuitem", { name: /install app/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the browser's own install dialog when it offers one", async () => {
    browse(ANDROID_CHROME);
    renderWithProviders(<UserMenu />);
    const { prompt, event } = offerInstall();
    expect(event.defaultPrevented).toBe(true);
    await openMenu();

    await userEvent.click(
      await screen.findByRole("menuitem", { name: /install app/i }),
    );

    expect(prompt).toHaveBeenCalledOnce();
    // The event only works once: the item goes away after it was used.
    await openMenu();
    await vi.waitFor(() =>
      expect(
        screen.queryByRole("menuitem", { name: /install app/i }),
      ).not.toBeInTheDocument(),
    );
  });
});

describe("InstallBanner", () => {
  it("stays hidden until a few translations were made", async () => {
    browse(IPHONE_SAFARI);
    renderWithProviders(<InstallBanner />);
    expect(
      screen.queryByRole("complementary", { name: "Install parlo" }),
    ).not.toBeInTheDocument();

    act(() => {
      for (let i = 0; i < NUDGE_AFTER - 1; i++) countTranslation();
    });
    expect(
      screen.queryByRole("complementary", { name: "Install parlo" }),
    ).not.toBeInTheDocument();

    act(() => countTranslation());
    expect(
      await screen.findByRole("complementary", { name: "Install parlo" }),
    ).toBeInTheDocument();
  });

  it("offers the guide on iOS and goes away when dismissed", async () => {
    browse(IPHONE_SAFARI);
    renderWithProviders(<InstallBanner />);
    act(() => {
      for (let i = 0; i < NUDGE_AFTER; i++) countTranslation();
    });

    await userEvent.click(
      await screen.findByRole("button", { name: "Show me how" }),
    );
    expect(
      await screen.findByText(/add to home screen/i, { selector: "strong" }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Got it" }));

    await userEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(
      screen.queryByRole("complementary", { name: "Install parlo" }),
    ).not.toBeInTheDocument();
  });

  it("installs straight away when the browser offers a dialog", async () => {
    browse(ANDROID_CHROME);
    renderWithProviders(<InstallBanner />);
    const { prompt } = offerInstall();
    act(() => {
      for (let i = 0; i < NUDGE_AFTER; i++) countTranslation();
    });

    await userEvent.click(
      await screen.findByRole("button", { name: "Install" }),
    );

    expect(prompt).toHaveBeenCalledOnce();
  });

  it("does not appear in the installed app", () => {
    browse(IPHONE_SAFARI, { standalone: true });
    renderWithProviders(<InstallBanner />);
    act(() => {
      for (let i = 0; i < NUDGE_AFTER; i++) countTranslation();
    });
    expect(
      screen.queryByRole("complementary", { name: "Install parlo" }),
    ).not.toBeInTheDocument();
  });
});
