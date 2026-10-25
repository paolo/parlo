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

  it("lets right-to-left text pick its own direction", () => {
    renderWithProviders(
      <PhraseCard
        phrase={{
          lang: "ar",
          text: "مرحبا بالعالم",
          isRoot: false,
          correctedFrom: null,
        }}
      />,
    );
    expect(screen.getByText("مرحبا بالعالم")).toHaveAttribute("dir", "auto");
  });

  it("colors the card by the role it is given", () => {
    renderWithProviders(
      <PhraseCard
        phrase={{
          lang: "en",
          text: "It's pouring",
          isRoot: false,
          correctedFrom: null,
        }}
        langRole="english"
      />,
    );
    expect(screen.getByRole("article")).toHaveAttribute("data-role", "english");
  });

  it("is neutral without a role", () => {
    renderWithProviders(
      <PhraseCard
        phrase={{
          lang: "hi",
          text: "बहुत बारिश हो रही है",
          isRoot: false,
          correctedFrom: null,
        }}
      />,
    );
    expect(screen.getByRole("article")).not.toHaveAttribute("data-role");
  });

  it("marks the phrase with its language", () => {
    renderWithProviders(
      <PhraseCard
        phrase={{
          lang: "uk",
          text: "Дощ іде",
          isRoot: false,
          correctedFrom: null,
        }}
      />,
    );
    expect(screen.getByText("Дощ іде")).toHaveAttribute("lang", "uk");
  });
});
