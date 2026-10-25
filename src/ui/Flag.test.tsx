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

  it("takes an accessible name and a size", () => {
    render(<Flag region="es" alt="Spain" size={24} />);

    expect(screen.getByAltText("Spain")).toHaveAttribute("width", "24");
  });
});
