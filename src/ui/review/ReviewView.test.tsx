import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import { makeGroup } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { ReviewView } from "./ReviewView";

const keepOrder = () => 0.999999;

const profile = [
  { lang: "es", region: "BO", level: "native", position: 0 },
  { lang: "en", region: "GB", level: "intermediate", position: 1 },
  { lang: "fr", region: "FR", level: "intermediate", position: 2 },
];

const card = (id: string, es: string, en: string, fr: string): PhraseGroupDTO =>
  makeGroup({
    id,
    isFavorite: true,
    phrases: [
      { lang: "es", text: es, isRoot: true, correctedFrom: null },
      { lang: "en", text: en, isRoot: false, correctedFrom: null },
      { lang: "fr", text: fr, isRoot: false, correctedFrom: null },
    ],
  });
const a = card("a", "Uno", "One", "Un");
const b = card("b", "Dos", "Two", "Deux");

const PREFS_KEY = "parlo.practice";
const remember = (prefs: object) =>
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));

/** Answers the profile, favorites with `groups` and history with `history`. */
function mockApi(groups: PhraseGroupDTO[], history: PhraseGroupDTO[] = groups) {
  const api = vi.fn(async (url: string) =>
    url === "/api/profile"
      ? Response.json({ languages: profile })
      : Response.json({
          items: url.includes("favorite=false") ? history : groups,
          nextCursor: null,
          limit: 100,
        }),
  );
  vi.stubGlobal("fetch", api);
  return api;
}

const click = (name: string | RegExp) =>
  userEvent.click(screen.getByRole("button", { name }));

/** Presses Start on the setup screen once it has loaded. */
async function start() {
  await userEvent.click(
    await screen.findByRole("button", { name: /^start$/i }),
  );
}
const pickRadio = async (group: string, name: string) =>
  userEvent.click(
    within(await screen.findByRole("radiogroup", { name: group })).getByRole(
      "radio",
      { name },
    ),
  );

/** Opens a language pill ("Practice in" or "Type in") and picks a language from its list. */
async function pickLanguage(label: string, language: RegExp) {
  await userEvent.click(
    await screen.findByRole("button", { name: new RegExp(`^${label}:`) }),
  );
  await userEvent.click(
    await screen.findByRole("menuitem", { name: language }),
  );
}

describe("ReviewView", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Most tests practice the favorites they mock, 20 at a time.
    remember({ source: "favorites", count: 20 });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("starts in the second language and hides the other versions until Reveal", async () => {
    mockApi([a]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await start();

    expect(await screen.findByText("One")).toBeInTheDocument();
    expect(screen.queryByText("Uno")).not.toBeInTheDocument();
    expect(screen.queryByText("Un")).not.toBeInTheDocument();

    await click("Reveal");

    expect(screen.getByText("Uno")).toBeInTheDocument();
    expect(screen.getByText("Un")).toBeInTheDocument();
  });

  it("advances on Got it and updates the progress", async () => {
    mockApi([a, b]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await start();
    await screen.findByText("One");
    expect(screen.getByText("0 of 2")).toBeInTheDocument();

    await click("Reveal");
    await click("Got it");

    expect(await screen.findByText("Two")).toBeInTheDocument();
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
    expect(screen.queryByText("Uno")).not.toBeInTheDocument();
  });

  it("shows an Again card once more, then ends in a summary that can restart", async () => {
    mockApi([a, b]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await start();
    await screen.findByText("One");

    await click("Reveal");
    await click("Again");
    expect(await screen.findByText("Two")).toBeInTheDocument();
    await click("Reveal");
    await click("Got it");
    expect(await screen.findByText("One")).toBeInTheDocument();
    await click("Reveal");
    await click("Got it");

    expect(
      await screen.findByText("1 of 2 right on the first try"),
    ).toBeInTheDocument();
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to phrasebook" }),
    ).toHaveAttribute("href", "/phrasebook");

    await click("Practice again");

    expect(await screen.findByText("0 of 2")).toBeInTheDocument();
    expect(screen.getByText("One")).toBeInTheDocument();
  });

  it("practices in the language picked on the setup screen", async () => {
    mockApi([a, b]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await pickLanguage("Practice in", /Français/);
    await start();

    expect(await screen.findByText("Un")).toBeInTheDocument();
    expect(screen.getByText("0 of 2")).toBeInTheDocument();
  });

  it("skips and counts groups without the practice language", async () => {
    const noEnglish = makeGroup({
      id: "old",
      phrases: [
        { lang: "es", text: "Hola", isRoot: true, correctedFrom: null },
        { lang: "fr", text: "Salut", isRoot: false, correctedFrom: null },
      ],
    });
    mockApi([a, noEnglish]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await start();

    expect(await screen.findByText("One")).toBeInTheDocument();
    expect(
      screen.getByText("1 phrase skipped: no English version"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 of 1")).toBeInTheDocument();
  });

  it("swaps the practice and typing languages with one tap", async () => {
    mockApi([a]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await pickRadio("How to practice", "Type");
    expect(
      screen.getByRole("button", { name: "Practice in: English" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Type in: Español" }),
    ).toBeInTheDocument();

    await click("Swap languages");

    expect(
      screen.getByRole("button", { name: "Practice in: Español" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Type in: English" }),
    ).toBeInTheDocument();
    await start();
    expect(await screen.findByText("Uno")).toBeInTheDocument();
  });

  it("explains that practice uses favorite phrases when there are none", async () => {
    mockApi([]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await pickRadio("Where cards come from", "Favorites");
    await start();

    expect(await screen.findByText("Your deck is empty")).toBeInTheDocument();
    expect(
      screen.getByText(/practice uses your favorite phrases/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Practice in:/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /translate/i })).toHaveAttribute(
      "href",
      "/",
    );
    // A way forward in place: Starter always has cards.
    await click("Use Starter");
    expect(await screen.findByText("0 of 3")).toBeInTheDocument();
  });

  it("only ever reads the profile and the favorites", async () => {
    const api = mockApi([a]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await start();
    await screen.findByText("One");
    await click("Reveal");
    await click("Got it");

    const urls = api.mock.calls.map(([url]) => url);
    expect(new Set(urls)).toEqual(
      new Set(["/api/profile", "/api/phrase-groups?favorite=true&limit=100"]),
    );
  });

  describe("setup", () => {
    it("opens on Starter with 10 cards on a first visit", async () => {
      window.localStorage.clear();
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);

      await screen.findByRole("button", { name: /^start$/i });
      expect(screen.getByRole("radio", { name: "Starter" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "10" })).toBeChecked();
      expect(screen.queryByText("One")).not.toBeInTheDocument();
    });

    it("remembers the last source and count", async () => {
      remember({ source: "recent", count: 20 });
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);

      await screen.findByRole("button", { name: /^start$/i });
      expect(screen.getByRole("radio", { name: "Recent" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "20" })).toBeChecked();
    });

    it("saves the choice when practice starts", async () => {
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await pickRadio("How many cards", "5");
      await start();

      expect(JSON.parse(window.localStorage.getItem(PREFS_KEY) ?? "")).toEqual({
        source: "favorites",
        count: 5,
      });
    });

    it("falls back to Starter when the saved Favorites is empty", async () => {
      mockApi([]);
      renderWithProviders(<ReviewView random={keepOrder} />);

      await screen.findByRole("button", { name: /^start$/i });
      expect(screen.getByRole("radio", { name: "Starter" })).toBeChecked();
    });

    it("survives unreadable storage", async () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("blocked");
      });
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);

      await screen.findByRole("button", { name: /^start$/i });
      expect(screen.getByRole("radio", { name: "Starter" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "10" })).toBeChecked();
    });

    it("deals only as many cards as asked", async () => {
      const seven = "abcdefg".split("").map((id) => card(id, id, id, id));
      remember({ source: "favorites", count: 5 });
      mockApi(seven);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await start();

      expect(await screen.findByText("0 of 5")).toBeInTheDocument();
    });

    it("deals everything when fewer cards exist than asked", async () => {
      mockApi([a, b]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await start();

      expect(await screen.findByText("0 of 2")).toBeInTheDocument();
    });

    it("collapses setup to a summary once started, and Change brings it back", async () => {
      remember({ source: "favorites", count: 5 });
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await start();

      expect(
        await screen.findByText("Favorites · 5 cards"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^start$/i }),
      ).not.toBeInTheDocument();

      await click("Change");

      expect(
        await screen.findByRole("button", { name: /^start$/i }),
      ).toBeInTheDocument();
      expect(screen.queryByText("One")).not.toBeInTheDocument();
    });

    it("deals Recent from history, including what was never favorited", async () => {
      remember({ source: "recent", count: 10 });
      const api = mockApi([], [a, b]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await start();

      expect(await screen.findByText("0 of 2")).toBeInTheDocument();
      expect(
        api.mock.calls.some(
          ([url]) => url === "/api/phrase-groups?favorite=false&limit=100",
        ),
      ).toBe(true);
    });

    it("does not ask for history unless Recent is chosen", async () => {
      const api = mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await start();
      await screen.findByText("One");

      const urls = api.mock.calls.map(([url]) => String(url));
      expect(urls.some((url) => url.includes("favorite=false"))).toBe(false);
    });

    it("offers Starter when Recent fails to load", async () => {
      remember({ source: "recent", count: 10 });
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) =>
          url === "/api/profile"
            ? Response.json({ languages: profile })
            : url.includes("favorite=false")
              ? Response.json({ error: "boom" }, { status: 500 })
              : Response.json({ items: [a], nextCursor: null, limit: 100 }),
        ),
      );
      renderWithProviders(<ReviewView random={keepOrder} />);
      await start();

      expect(
        await screen.findByText(/couldn't load these phrases/i),
      ).toBeInTheDocument();
      await click("Use Starter");
      expect(await screen.findByText("0 of 3")).toBeInTheDocument();
    });

    it("shows Starter cards in Arabic as Arabic, directed by the text", async () => {
      window.localStorage.clear();
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) =>
          url === "/api/profile"
            ? Response.json({
                languages: [
                  { lang: "en", region: "CA", level: "native", position: 0 },
                  {
                    lang: "ar",
                    region: "EG",
                    level: "intermediate",
                    position: 1,
                  },
                  {
                    lang: "fa",
                    region: "IR",
                    level: "intermediate",
                    position: 2,
                  },
                ],
              })
            : Response.json({ items: [], nextCursor: null, limit: 100 }),
        ),
      );
      renderWithProviders(<ReviewView random={keepOrder} />);
      await start();

      await screen.findByText("0 of 3");
      expect(document.querySelector('[lang="ar"][dir="auto"]')).not.toBeNull();
    });

    it("deals a fresh draw from the same source on Practice again", async () => {
      remember({ source: "favorites", count: 5 });
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await start();
      await screen.findByText("One");
      await click("Reveal");
      await click("Got it");
      await click("Practice again");

      expect(await screen.findByText("0 of 1")).toBeInTheDocument();
      expect(screen.getByText("Favorites · 5 cards")).toBeInTheDocument();
    });
  });

  describe("typing", () => {
    const group = (name: string) => screen.getByRole("radiogroup", { name });
    async function startTyping(before?: () => Promise<void>) {
      await screen.findByRole("radiogroup", { name: "How to practice" });
      await userEvent.click(
        within(group("How to practice")).getByRole("radio", { name: "Type" }),
      );
      await before?.();
      await start();
    }
    const typeAnswer = async (text: string) => {
      await userEvent.type(screen.getByRole("textbox"), text);
      await click("Check");
    };

    it("asks for the native phrase by default instead of offering Reveal", async () => {
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping();

      expect(screen.getByText("One")).toBeInTheDocument();
      expect(screen.getByText("Write it in Español")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Reveal" }),
      ).not.toBeInTheDocument();
    });

    it("counts a correct answer and moves on", async () => {
      mockApi([a, b]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping();

      await typeAnswer("uno");
      expect(await screen.findByText("Correct")).toBeInTheDocument();
      await click("Next");

      expect(await screen.findByText("Two")).toBeInTheDocument();
      expect(screen.getByText("1 of 2")).toBeInTheDocument();
    });

    it("calls a missing accent almost, shows the right phrase and lets you count it", async () => {
      mockApi([card("q", "Qué tal", "How are you", "Ça va")]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping();

      await typeAnswer("que tal");

      expect(await screen.findByText("Almost")).toBeInTheDocument();
      expect(screen.getByText("Qué tal")).toBeInTheDocument();
      expect(screen.getByText("que tal")).toBeInTheDocument();
      await click("Count it");
      expect(
        await screen.findByText("1 of 1 right on the first try"),
      ).toBeInTheDocument();
    });

    it("on a wrong answer shows the phrase, and Again brings the card back", async () => {
      mockApi([a, b]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping();

      await typeAnswer("cero");
      expect(await screen.findByText("Not quite")).toBeInTheDocument();
      expect(screen.getByText("Uno")).toBeInTheDocument();
      await click("Again");

      expect(await screen.findByText("Two")).toBeInTheDocument();
      expect(screen.getByText("0 of 2")).toBeInTheDocument();
    });

    it("lets you overrule a wrong answer with I was right", async () => {
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping();

      await typeAnswer("el uno");
      await click("I was right");

      expect(
        await screen.findByText("1 of 1 right on the first try"),
      ).toBeInTheDocument();
    });

    it("does not check an empty answer", async () => {
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping();

      await click("Check");

      expect(screen.queryByText("Not quite")).not.toBeInTheDocument();
      expect(screen.getByText("Write it in Español")).toBeInTheDocument();
    });

    it("types in the chosen language, and the answer language never matches the start", async () => {
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping(() => pickLanguage("Type in", /Français/));

      expect(screen.getByText("Write it in Français")).toBeInTheDocument();
      await typeAnswer("un");
      expect(await screen.findByText("Correct")).toBeInTheDocument();

      await click("Change");
      await pickLanguage("Practice in", /Español/);
      // Starting from Español leaves English and Français to type in.
      await userEvent.click(screen.getByRole("button", { name: /^Type in:/ }));
      expect(
        screen.queryByRole("menuitem", { name: /Español/ }),
      ).not.toBeInTheDocument();
      expect(
        await screen.findByRole("menuitem", { name: /English/ }),
      ).toBeInTheDocument();
    });

    it("skips groups missing the answer language and says so", async () => {
      const noFrench = makeGroup({
        id: "nf",
        phrases: [
          { lang: "es", text: "Hola", isRoot: true, correctedFrom: null },
          { lang: "en", text: "Hello", isRoot: false, correctedFrom: null },
        ],
      });
      mockApi([a, noFrench]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping(() => pickLanguage("Type in", /Français/));

      expect(
        await screen.findByText(
          "1 phrase skipped: no English or French version",
        ),
      ).toBeInTheDocument();
    });
  });
});
