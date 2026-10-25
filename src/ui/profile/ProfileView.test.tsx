import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { signOut } from "../signOut";
import { ProfileView } from "./ProfileView";

const authClient = vi.hoisted(() => ({
  useSession: () => ({
    data: { user: { name: "Paolo", email: "paolo@test.dev", image: null } },
  }),
  signOut: vi.fn(),
}));
vi.mock("@/ui/auth-client", () => ({ authClient }));
vi.mock("../signOut", () => ({ signOut: vi.fn() }));

const stored = [
  { lang: "pt", region: "BR", level: "native", position: 0 },
  { lang: "en", region: "GB", level: "intermediate", position: 1 },
  { lang: "fr", region: "FR", level: "intermediate", position: 2 },
];

function mockApi() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ languages: stored })),
  );
}

describe("ProfileView", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows who is signed in", async () => {
    mockApi();
    renderWithProviders(<ProfileView />);

    expect(await screen.findByText("Paolo")).toBeInTheDocument();
    expect(screen.getByText("paolo@test.dev")).toBeInTheDocument();
  });

  it("shows the stored languages with their regions", async () => {
    mockApi();
    renderWithProviders(<ProfileView />);

    expect(
      await screen.findByRole("button", { name: /Native language/ }),
    ).toHaveTextContent("Português · Brazil");
    expect(
      screen.getByRole("button", { name: /Second language/ }),
    ).toHaveTextContent("English · United Kingdom");
    expect(
      screen.getByRole("button", { name: /Third language/ }),
    ).toHaveTextContent("Français · France");
  });

  it("saves a changed region", async () => {
    mockApi();
    renderWithProviders(<ProfileView />);

    await userEvent.click(
      await screen.findByRole("button", { name: /Second language/ }),
    );
    await userEvent.click(
      within(
        screen.getByRole("group", { name: "Second language region" }),
      ).getByRole("button", { name: /Canada/ }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Save languages" }),
    );

    expect(fetch).toHaveBeenCalledWith(
      "/api/profile",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          languages: [
            { lang: "pt", region: "BR" },
            { lang: "en", region: "CA" },
            { lang: "fr", region: "FR" },
          ],
        }),
      }),
    );
  });

  it("signs out from the page", async () => {
    mockApi();
    renderWithProviders(<ProfileView />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Sign out" }),
    );
    expect(signOut).toHaveBeenCalled();
  });
});
