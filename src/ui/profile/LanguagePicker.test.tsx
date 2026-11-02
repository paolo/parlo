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

/** The native slot starts as "Where are you from?": press a country (or a button in its next step). */
const pickNative = (name: string | RegExp) =>
  userEvent.click(screen.getByRole("button", { name }));

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

  it("picks the native language and country in one go, and sends the country", async () => {
    mockSave();
    renderWithProviders(<LanguagePicker />);

    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    await pickNative("Bolivia");
    expect(row("Native language")).toHaveTextContent("Español · Bolivia");
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

  it("asks which language for a country with several", async () => {
    renderWithProviders(<LanguagePicker />);

    await pickNative("Ukraine");
    await pickNative("Русский");

    expect(row("Native language")).toHaveTextContent("Русский · Ukraine");
  });

  it("lets someone whose country is missing pick a language directly", async () => {
    renderWithProviders(<LanguagePicker />);

    await pickNative("My country isn't listed");
    await pickNative("Español");

    expect(row("Native language")).toHaveTextContent("Español · Spain");
  });

  it("shows English and French countries too, since any language can be native", async () => {
    renderWithProviders(<LanguagePicker />);

    await userEvent.type(screen.getByRole("searchbox"), "canada");
    await pickNative("Canada");
    await pickNative("Français");

    expect(row("Native language")).toHaveTextContent("Français · Canada");
  });

  it("keeps the language and country chips once the native language is chosen, so it can be changed", async () => {
    renderWithProviders(<LanguagePicker />);
    await pickNative("Bolivia");

    await userEvent.click(row("Native language"));

    expect(
      within(group("Native language region")).getByRole("button", {
        name: "Bolivia",
        pressed: true,
      }),
    ).toBeInTheDocument();
    expect(
      within(group("Native language language")).getByRole("button", {
        name: /Español/,
        pressed: true,
      }),
    ).toBeInTheDocument();
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
    await pickNative("Bolivia");
    await pick("Second language", "language", /English/);

    expect(save()).toBeDisabled();

    await pick("Third language", "language", /Français/);
    expect(save()).toBeEnabled();
  });

  it("removes a chosen language from the other slots", async () => {
    renderWithProviders(<LanguagePicker />);
    await pickNative("Bolivia");
    // Choosing the country moves on to the next slot.
    expect(row("Second language")).toHaveAttribute("aria-expanded", "true");

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
