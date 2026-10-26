import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ProfileLanguage } from "@/server/profile/types";
import { LanguageStrip } from "./LanguageStrip";

const languages: ProfileLanguage[] = [
  { lang: "es", region: "BO", level: "native", position: 0 },
  { lang: "en", region: "CA", level: "intermediate", position: 1 },
  { lang: "fr", region: "FR", level: "intermediate", position: 2 },
];

describe("LanguageStrip", () => {
  it("lists all three languages with the flag of the region picked for each", () => {
    const { container } = render(<LanguageStrip languages={languages} />);

    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Français")).toBeInTheDocument();
    expect(
      [...container.querySelectorAll("img")].map((i) => i.getAttribute("src")),
    ).toEqual(["/flags/bo.svg", "/flags/ca.svg", "/flags/fr.svg"]);
  });

  it("shows no direction before a translation: nothing is marked", () => {
    const { container } = render(<LanguageStrip languages={languages} />);

    expect(container.querySelector("[data-detected]")).toBeNull();
    expect(screen.getByRole("group").getAttribute("aria-label")).not.toMatch(
      /detected/i,
    );
  });

  it("marks the detected language and names it for assistive technology", () => {
    const { container } = render(
      <LanguageStrip languages={languages} detected="en" />,
    );

    const marked = container.querySelectorAll("[data-detected]");
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveTextContent("English");
    expect(screen.getByRole("group")).toHaveAccessibleName(/Detected: English/);
  });

  it("is not a link, since nothing in it is pressable", () => {
    render(<LanguageStrip languages={languages} />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("names the languages for assistive technology", () => {
    render(<LanguageStrip languages={languages} detected="en" />);
    expect(screen.getByRole("group")).toHaveAccessibleName(
      "Your languages: Español, English, Français. Detected: English.",
    );
  });

  it("renders nothing without a profile", () => {
    const { container } = render(<LanguageStrip languages={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
