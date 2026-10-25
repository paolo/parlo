import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { LangLabel } from "./LangLabel";

describe("LangLabel", () => {
  it("shows the flag, the name and a non-default region", () => {
    const { container } = renderWithProviders(
      <LangLabel lang="es" region="BO" />,
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/flags/bo.svg",
    );
    expect(screen.getByText(/Español/)).toBeInTheDocument();
    expect(screen.getByText(/Bolivia/)).toBeInTheDocument();
  });

  it("falls back to the default flag and hides the default region name", () => {
    const { container } = renderWithProviders(<LangLabel lang="en" />);

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/flags/gb.svg",
    );
    expect(screen.getByText(/English/)).toBeInTheDocument();
    expect(screen.queryByText(/United Kingdom/)).not.toBeInTheDocument();
  });

  it("shows the flag of the region even when the name is shared with other regions", () => {
    const { container } = renderWithProviders(
      <LangLabel lang="fr" region="CA" />,
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/flags/ca.svg",
    );
    expect(screen.getByText(/Français/)).toBeInTheDocument();
    expect(screen.getByText(/Canada/)).toBeInTheDocument();
  });
});
