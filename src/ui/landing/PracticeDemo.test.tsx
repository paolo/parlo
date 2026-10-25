import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { PracticeDemo } from "./PracticeDemo";

describe("PracticeDemo", () => {
  it("shows the phrase first and hides the answers", () => {
    renderWithProviders(<PracticeDemo />);
    expect(screen.getByText("Costar un ojo de la cara")).toBeInTheDocument();
    expect(screen.queryByText("To cost an arm and a leg")).toBeNull();
  });

  it("reveals the English and French, then deals the next card", async () => {
    renderWithProviders(<PracticeDemo />);
    await userEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(screen.getByText("To cost an arm and a leg")).toBeInTheDocument();
    expect(screen.getByText("Coûter les yeux de la tête")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Next card" }));
    expect(screen.getByText("Pagar o pato")).toBeInTheDocument();
    expect(screen.queryByText("To take the fall")).toBeNull();
  });

  it("marks each phrase with its language", () => {
    renderWithProviders(<PracticeDemo />);
    expect(screen.getByText("Costar un ojo de la cara")).toHaveAttribute(
      "lang",
      "es",
    );
  });
});
