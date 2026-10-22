import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
  });

  it("is 1 for identical colors", () => {
    expect(contrastRatio("#4c5fd5", "#4c5fd5")).toBeCloseTo(1, 5);
  });

  it("matches the WCAG value for #777 on white", () => {
    expect(contrastRatio("#777", "#fff")).toBeCloseTo(4.48, 2);
  });
});
