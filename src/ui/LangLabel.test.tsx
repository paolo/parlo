import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { LangLabel } from "./LangLabel";

describe("LangLabel", () => {
  it("shows the flag, the name and a non-default region", () => {
    renderWithProviders(<LangLabel lang="es" region="BO" />);

    expect(screen.getByText(/🇧🇴 Español/)).toBeInTheDocument();
    expect(screen.getByText(/Bolivia/)).toBeInTheDocument();
  });

  it("falls back to the default flag and hides the default region name", () => {
    renderWithProviders(<LangLabel lang="en" />);

    expect(screen.getByText(/🇬🇧 English/)).toBeInTheDocument();
    expect(screen.queryByText(/United Kingdom/)).not.toBeInTheDocument();
  });

  it("shows the flag of the region even when the name is shared with other regions", () => {
    renderWithProviders(<LangLabel lang="fr" region="CA" />);

    expect(screen.getByText(/🇨🇦 Français/)).toBeInTheDocument();
    expect(screen.getByText(/Canada/)).toBeInTheDocument();
  });
});
