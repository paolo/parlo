import { DEFAULT_THEME, mergeMantineTheme } from "@mantine/core";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import { cssVariablesResolver, theme } from "./theme";

const AA = 4.5;
// createTheme gives a partial override; the resolvers take the full theme Mantine builds from it.
const full = mergeMantineTheme(DEFAULT_THEME, theme);

describe("theme", () => {
  // iOS Safari zooms into any focused input under 16px, which also leaves a horizontal scroll behind.
  it.each([
    "Textarea",
    "TextInput",
    "PasswordInput",
    "Select",
  ])("renders %s at the 16px size", (name) => {
    expect(theme.components?.[name]?.defaultProps?.size).toBe("md");
  });

  describe("palette", () => {
    it("uses the parlo accent as the primary color", () => {
      expect(theme.primaryColor).toBe("parlo");
      expect(theme.primaryShade).toEqual({ light: 6, dark: 4 });
    });

    it("anchors the accent scale at shades 4 and 6", () => {
      const parlo = theme.colors?.parlo;
      expect(parlo).toHaveLength(10);
      expect(parlo?.[6]).toBe("#4c5fd5");
      expect(parlo?.[4]).toBe("#8f9cf5");
    });

    it("tints the dark scale", () => {
      const dark = theme.colors?.dark;
      expect(dark).toHaveLength(10);
      expect(dark?.[0]).toBe("#eceefb");
      expect(dark?.[2]).toBe("#8d93b8");
      expect(dark?.[6]).toBe("#21244a");
      expect(dark?.[7]).toBe("#14162a");
    });

    it("sets heavy headings", () => {
      expect(theme.headings?.fontWeight).toBe("800");
    });
  });

  describe("cssVariablesResolver", () => {
    const light = cssVariablesResolver(full).light as Record<string, string>;

    it("sets the light body, text and dimmed colors", () => {
      expect(light["--mantine-color-body"]).toBe("#f4f5fb");
      expect(light["--mantine-color-text"]).toBe("#1d2033");
      expect(light["--mantine-color-dimmed"]).toBe("#62678a");
    });
  });

  describe("contrast", () => {
    const light = cssVariablesResolver(full).light as Record<string, string>;
    const dark = full.colors.dark;
    const parlo = full.colors.parlo;
    const lightBody = light["--mantine-color-body"];
    const white = "#ffffff";

    it.each([
      ["text on the light body", light["--mantine-color-text"], lightBody],
      ["dimmed on the light body", light["--mantine-color-dimmed"], lightBody],
      ["dimmed on a white surface", light["--mantine-color-dimmed"], white],
      ["accent on the light body", parlo[6], lightBody],
      ["text on the dark body", dark[0], dark[7]],
      ["dimmed on the dark body", dark[2], dark[7]],
      ["dimmed on a dark surface", dark[2], dark[6]],
      ["accent on the dark body", parlo[4], dark[7]],
      ["accent on a dark surface", parlo[4], dark[6]],
    ])("meets AA for %s", (_name, foreground, background) => {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(AA);
    });
  });

  // Filled buttons put text on the primary shade. Shade 4 (dark scheme) is too light for white text, and it
  // cannot be darkened because the same shade is the accent used as text on the dark page. Mantine's
  // autoContrast only looks at the light shade, so the filled variant picks its text color per scheme.
  describe("filled primary buttons", () => {
    const parlo = full.colors.parlo;

    it("shows why: white is fine on shade 6 but fails on shade 4, where black passes", () => {
      expect(
        contrastRatio("#ffffff", parlo[6] as string),
      ).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio("#ffffff", parlo[4] as string)).toBeLessThan(AA);
      expect(
        contrastRatio("#000000", parlo[4] as string),
      ).toBeGreaterThanOrEqual(AA);
    });

    it.each([
      ["the primary color", full.primaryColor],
      ["parlo", "parlo"],
    ])("uses white text in light and black in dark for %s", (_name, color) => {
      const result = full.variantColorResolver({
        variant: "filled",
        theme: full,
        color,
      });
      expect(result.color).toMatch(/^light-dark\(.*white.*,.*black.*\)$/);
    });

    it("leaves other colors alone", () => {
      const result = full.variantColorResolver({
        variant: "filled",
        theme: full,
        color: "red",
      });
      expect(result.color).not.toContain("light-dark");
    });
  });

  describe("surfaces", () => {
    it("gives Paper a white light surface and a dark[6] dark surface", () => {
      const paper = theme.components?.Paper;
      expect(JSON.stringify(paper?.styles ?? paper?.vars ?? {})).toMatch(
        /light-dark\(.*(white|#fff).*dark-6/i,
      );
    });
  });

  describe("google button variant", () => {
    const result = full.variantColorResolver({
      variant: "google",
      theme: full,
      color: "gray",
    });

    it("uses Google's light and dark fills", () => {
      expect(result.background).toContain("#FFFFFF");
      expect(result.background).toContain("#131314");
    });

    it("uses Google's light and dark text and strokes", () => {
      expect(result.color).toContain("#1F1F1F");
      expect(result.color).toContain("#E3E3E3");
      expect(result.border).toContain("#747775");
      expect(result.border).toContain("#8E918F");
    });

    // Mantine uses `border` as the whole `border` shorthand, so a bare color draws nothing.
    it("draws a solid 1px-style border, not just a color", () => {
      expect(result.border).toMatch(/^calc\(.*\) solid light-dark\(/);
    });

    it("leaves other variants to Mantine", () => {
      const filled = full.variantColorResolver({
        variant: "filled",
        theme: full,
        color: "parlo",
      });
      expect(filled.background).not.toContain("light-dark");
    });
  });
});
