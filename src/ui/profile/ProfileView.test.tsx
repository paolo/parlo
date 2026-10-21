import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ProfileView } from "./ProfileView";

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

  it("shows the stored languages with an editable region each", async () => {
    mockApi();
    renderWithProviders(<ProfileView />);

    expect(
      await screen.findByLabelText("Native language region", {
        selector: "input",
      }),
    ).toHaveValue("🇧🇷 Brazil");
    expect(
      screen.getByLabelText("Second language region", { selector: "input" }),
    ).toHaveValue("🇬🇧 United Kingdom");
    expect(
      screen.getByLabelText("Third language region", { selector: "input" }),
    ).toHaveValue("🇫🇷 France");
  });

  it("saves a changed region", async () => {
    mockApi();
    renderWithProviders(<ProfileView />);

    await userEvent.click(
      await screen.findByLabelText("Second language region", {
        selector: "input",
      }),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: /Canada/ }),
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
});
