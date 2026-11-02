import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ProfileLanguage } from "@/server/profile/types";
import { renderWithProviders } from "@/test/render";
import { TranslatingPhrase } from "./TranslatingPhrase";

const languages: ProfileLanguage[] = [
  { lang: "es", region: "BO", level: "native", position: 0 },
  { lang: "en", region: "CA", level: "intermediate", position: 1 },
  { lang: "fr", region: "FR", level: "intermediate", position: 2 },
];

describe("TranslatingPhrase", () => {
  it("tells assistive technology it is translating, once", () => {
    renderWithProviders(
      <TranslatingPhrase text="Je n'ai pas compris" languages={languages} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Translating");
  });

  it("gives each word of the phrase its own beat, in the roles' order", () => {
    const { container } = renderWithProviders(
      <TranslatingPhrase
        text="  Je n'ai   pas compris "
        languages={languages}
      />,
    );

    const words = [...container.querySelectorAll("[data-role]")].filter(
      (el) => el.tagName === "SPAN",
    );
    expect(words.map((w) => w.textContent)).toEqual([
      "Je",
      "n'ai",
      "pas",
      "compris",
    ]);
    expect(words.map((w) => w.getAttribute("data-role"))).toEqual([
      "native",
      "english",
      "french",
      "native",
    ]);
  });

  it("names the viewer's languages in their own language, each with its flag", () => {
    const { container } = renderWithProviders(
      <TranslatingPhrase text="hola" languages={languages} />,
    );

    expect(
      screen
        .getAllByRole("listitem", { hidden: true })
        .map((li) => li.textContent),
    ).toEqual(["Español", "English", "Français"]);
    expect(
      [...container.querySelectorAll("img")].map((i) => i.getAttribute("src")),
    ).toEqual(["/flags/bo.svg", "/flags/ca.svg", "/flags/fr.svg"]);
  });
});
