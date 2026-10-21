import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { LanguagePicker } from "./LanguagePicker";

function mockSave() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ languages: [] })),
  );
}

async function choose(label: string, option: RegExp | string) {
  await userEvent.click(input(label));
  await userEvent.click(await screen.findByRole("option", { name: option }));
}

const input = (name: string) =>
  screen.getByLabelText(name, { selector: "input" });
const save = () => screen.getByRole("button", { name: "Save languages" });

describe("LanguagePicker", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("preselects the default region of the native language and sends the chosen one", async () => {
    mockSave();
    renderWithProviders(<LanguagePicker />);

    await choose("Native language", /Español/);
    expect(input("Native language region")).toHaveValue("🇪🇸 Spain");

    await choose("Native language region", /Bolivia/);
    await choose("Second language", /English/);
    await choose("Third language", /Français/);
    await userEvent.click(save());

    expect(fetch).toHaveBeenCalledWith(
      "/api/profile",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          languages: [
            { lang: "es", region: "BO" },
            { lang: "en" },
            { lang: "fr" },
          ],
        }),
      }),
    );
  });

  it("does not ask for a region on the learning languages", async () => {
    renderWithProviders(<LanguagePicker />);

    expect(
      screen.queryByLabelText("Second language region", { selector: "input" }),
    ).not.toBeInTheDocument();
  });

  it("keeps Save disabled until all three languages are chosen", async () => {
    renderWithProviders(<LanguagePicker />);
    await choose("Native language", /Español/);
    await choose("Second language", /English/);

    expect(save()).toBeDisabled();

    await choose("Third language", /Français/);
    expect(save()).toBeEnabled();
  });

  it("removes a chosen language from the other slots", async () => {
    renderWithProviders(<LanguagePicker />);
    await choose("Native language", /Español/);

    await userEvent.click(input("Second language"));
    const options = await screen.findAllByRole("option");

    expect(options.some((o) => within(o).queryByText(/Español/))).toBe(false);
    expect(options.some((o) => within(o).queryByText(/English/))).toBe(true);
  });

  it("shows every region select and the stored values when editing a profile", () => {
    renderWithProviders(
      <LanguagePicker
        initial={[
          { lang: "pt", region: "BR", level: "native", position: 0 },
          { lang: "en", region: "GB", level: "intermediate", position: 1 },
          { lang: "fr", region: "FR", level: "intermediate", position: 2 },
        ]}
      />,
    );

    expect(input("Native language region")).toHaveValue("🇧🇷 Brazil");
    expect(input("Second language region")).toHaveValue("🇬🇧 United Kingdom");
    expect(input("Third language region")).toHaveValue("🇫🇷 France");
  });
});
