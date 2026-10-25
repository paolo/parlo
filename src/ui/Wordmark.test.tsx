import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { Wordmark } from "./Wordmark";

describe("Wordmark", () => {
  it("is named parlo", () => {
    renderWithProviders(<Wordmark />);
    expect(screen.getByRole("img", { name: "parlo" })).toBeInTheDocument();
  });

  it("scales the type and the dots with the size", () => {
    renderWithProviders(<Wordmark size={40} />);
    const root = screen.getByRole("img", { name: "parlo" });
    expect(root).toHaveStyle({ fontSize: "40px" });
    expect(root.querySelector("[aria-hidden] + span")).toHaveStyle({
      "--dot": "9px",
    });
  });

  it("marks the light-surface variant", () => {
    renderWithProviders(<Wordmark onLight />);
    expect(screen.getByRole("img", { name: "parlo" })).toHaveAttribute(
      "data-on-light",
      "true",
    );
  });
});
