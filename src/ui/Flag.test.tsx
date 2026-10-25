import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Flag } from "./Flag";

describe("Flag", () => {
  it("points at the lowercase svg for the region and is decorative by default", () => {
    const { container } = render(<Flag region="BO" />);

    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/flags/bo.svg");
    expect(img).toHaveAttribute("alt", "");
  });

  it("takes an accessible name", () => {
    render(<Flag region="es" alt="Spain" />);

    expect(screen.getByAltText("Spain")).toBeInTheDocument();
  });

  it("sizes by CSS so relative units work", () => {
    render(<Flag region="es" alt="Spain" size="1.5rem" />);

    const { style } = screen.getByAltText("Spain");
    expect([style.width, style.height]).toEqual(["1.5rem", "1.5rem"]);
  });
});
