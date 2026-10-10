import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { PhraseCard } from "./PhraseCard";

describe("PhraseCard", () => {
  it("shows the language and text, and marks the original phrase", () => {
    renderWithProviders(
      <PhraseCard
        phrase={{
          lang: "fr",
          text: "Il pleut des cordes",
          isRoot: true,
          correctedFrom: null,
        }}
      />,
    );
    expect(screen.getByText("Il pleut des cordes")).toBeInTheDocument();
    expect(screen.getByText(/français/i)).toBeInTheDocument();
    expect(screen.getByText(/original/i)).toBeInTheDocument();
  });

  it("does not mark translations as original", () => {
    renderWithProviders(
      <PhraseCard
        phrase={{
          lang: "en",
          text: "It's pouring",
          isRoot: false,
          correctedFrom: null,
        }}
      />,
    );
    expect(screen.queryByText(/original/i)).not.toBeInTheDocument();
  });

  it("offers a copy button", () => {
    renderWithProviders(
      <PhraseCard
        phrase={{
          lang: "en",
          text: "It's pouring",
          isRoot: false,
          correctedFrom: null,
        }}
      />,
    );
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
  });
});
