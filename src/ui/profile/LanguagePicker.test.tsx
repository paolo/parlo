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

const row = (name: string) =>
  screen.getByRole("button", { name: new RegExp(name) });
const group = (name: string) => screen.getByRole("group", { name });
const save = () => screen.getByRole("button", { name: "Save languages" });

/** Opens a slot (the native one starts open) and presses a chip in its language or region group. */
async function pick(slot: string, kind: "language" | "region", chip: RegExp) {
  if (row(slot).getAttribute("aria-expanded") !== "true") {
    await userEvent.click(row(slot));
  }
  await userEvent.click(
    within(group(`${slot} ${kind}`)).getByRole("button", { name: chip }),
  );
}

describe("LanguagePicker", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("starts with every slot closed when the profile is complete", () => {
    renderWithProviders(
      <LanguagePicker
        initial={[
          { lang: "es", region: "BO", level: "native", position: 0 },
          { lang: "en", region: "GB", level: "intermediate", position: 1 },
          { lang: "fr", region: "FR", level: "intermediate", position: 2 },
        ]}
      />,
    );

    for (const name of [
      "Native language",
      "Second language",
      "Third language",
    ]) {
      expect(row(name)).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("starts with the native slot open and the learning slots closed", () => {
    renderWithProviders(<LanguagePicker />);

    expect(row("Native language")).toHaveAttribute("aria-expanded", "true");
    expect(row("Second language")).toHaveAttribute("aria-expanded", "false");
    expect(row("Third language")).toHaveAttribute("aria-expanded", "false");
  });

  it("preselects the default region of the native language and sends the chosen one", async () => {
    mockSave();
    renderWithProviders(<LanguagePicker />);

    await pick("Native language", "language", /Español/);
    expect(
      within(group("Native language region")).getByRole("button", {
        name: "Spain",
        pressed: true,
      }),
    ).toBeInTheDocument();

    await pick("Native language", "region", /Bolivia/);
    await pick("Second language", "language", /English/);
    await pick("Third language", "language", /Français/);
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
    await pick("Second language", "language", /English/);

    expect(
      screen.queryByRole("group", { name: "Second language region" }),
    ).not.toBeInTheDocument();
  });

  it("keeps Save disabled until all three languages are chosen", async () => {
    renderWithProviders(<LanguagePicker />);
    await pick("Native language", "language", /Español/);
    await pick("Second language", "language", /English/);

    expect(save()).toBeDisabled();

    await pick("Third language", "language", /Français/);
    expect(save()).toBeEnabled();
  });

  it("removes a chosen language from the other slots", async () => {
    renderWithProviders(<LanguagePicker />);
    await pick("Native language", "language", /Español/);
    await userEvent.click(row("Second language"));

    const chips = within(group("Second language language")).getAllByRole(
      "button",
    );
    expect(chips.some((c) => /Español/.test(c.textContent ?? ""))).toBe(false);
    expect(chips.some((c) => /English/.test(c.textContent ?? ""))).toBe(true);
  });

  it("shows every slot's language and region when editing a profile", () => {
    renderWithProviders(
      <LanguagePicker
        initial={[
          { lang: "pt", region: "BR", level: "native", position: 0 },
          { lang: "en", region: "GB", level: "intermediate", position: 1 },
          { lang: "fr", region: "FR", level: "intermediate", position: 2 },
        ]}
      />,
    );

    expect(row("Native language")).toHaveTextContent("Português · Brazil");
    expect(row("Second language")).toHaveTextContent(
      "English · United Kingdom",
    );
    expect(row("Third language")).toHaveTextContent("Français · France");
  });

  it("opens one slot at a time", async () => {
    renderWithProviders(<LanguagePicker />);
    await userEvent.click(row("Second language"));

    expect(row("Native language")).toHaveAttribute("aria-expanded", "false");
    expect(row("Second language")).toHaveAttribute("aria-expanded", "true");
  });
});
