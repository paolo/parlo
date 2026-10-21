import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeGroup } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { TranslationResult } from "./TranslationResult";

const phrase = (lang: "pt" | "en" | "fr", text: string, isRoot = false) => ({
  lang,
  text,
  isRoot,
  correctedFrom: null,
});

describe("TranslationResult", () => {
  it("renders one card per phrase for any languages and names the detected one", () => {
    const group = makeGroup({
      phrases: [
        phrase("pt", "Tô com saudade", true),
        phrase("en", "I miss you"),
        phrase("fr", "Tu me manques"),
      ],
    });
    renderWithProviders(<TranslationResult group={group} />);

    expect(screen.getByText("Tô com saudade")).toBeInTheDocument();
    expect(screen.getByText("I miss you")).toBeInTheDocument();
    expect(screen.getByText("Tu me manques")).toBeInTheDocument();
    const detected = screen.getByText("Detected").parentElement;
    expect(detected).toHaveTextContent(/português/i);
  });

  it("still shows every phrase of a legacy es/en/fr group for a pt/en/fr profile", () => {
    renderWithProviders(
      <TranslationResult
        group={makeGroup()}
        profileLangs={["pt", "en", "fr"]}
      />,
    );

    expect(screen.getByText("Llueve a cántaros")).toBeInTheDocument();
    expect(screen.getByText("It's pouring")).toBeInTheDocument();
    expect(screen.getByText("Il pleut des cordes")).toBeInTheDocument();
  });
});
