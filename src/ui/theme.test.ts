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
    it("uses lilac as the single accent", () => {
      expect(theme.primaryColor).toBe("english");
      expect(theme.colors?.english?.every((c) => c === "#b9a6ff")).toBe(true);
    });

    it("defines the three language roles", () => {
      expect(theme.colors?.native?.[0]).toBe("#ffb38a");
      expect(theme.colors?.english?.[0]).toBe("#b9a6ff");
      expect(theme.colors?.french?.[0]).toBe("#8fe3c3");
    });

    it("sets the dark scale from the parlo tokens", () => {
      const dark = theme.colors?.dark;
      expect(dark).toHaveLength(10);
      expect(dark?.[0]).toBe("#f3f1f8");
      expect(dark?.[2]).toBe("#a9a6b8");
      expect(dark?.[6]).toBe("#1f1e27");
      expect(dark?.[7]).toBe("#15141b");
    });

    it("sets heavy display headings", () => {
      expect(theme.headings?.fontWeight).toBe("800");
      expect(theme.headings?.fontFamily).toBe("var(--parlo-font-display)");
    });

    it("makes buttons pills", () => {
      expect(theme.components?.Button?.defaultProps?.radius).toBe("xl");
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
    const lightBody = light["--mantine-color-body"];
    const white = "#ffffff";
    const roles = [
      ["native", "#ffb38a", "#6b3a1f"],
      ["english", "#b9a6ff", "#3b2f7a"],
      ["french", "#8fe3c3", "#1d5a44"],
    ] as const;

    it.each([
      ["text on the light body", light["--mantine-color-text"], lightBody],
      ["dimmed on the light body", light["--mantine-color-dimmed"], lightBody],
      ["dimmed on a white surface", light["--mantine-color-dimmed"], white],
      ["text on the dark body", dark[0], dark[7]],
      ["text-soft on the dark body", dark[1], dark[7]],
      ["muted on the dark body", dark[2], dark[7]],
      ["muted on a dark surface", dark[2], dark[6]],
      ["muted on a chip", dark[2], dark[5]],
      ["text on a chip", dark[0], dark[5]],
      ["placeholder on a surface", dark[3], dark[6]],
      ["lilac accent on the dark body", "#b9a6ff", dark[7]],
    ])("meets AA for %s", (_name, foreground, background) => {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(AA);
    });

    it.each(
      roles,
    )("puts dark text on the %s role color", (_name, fill, ink) => {
      expect(contrastRatio(dark[7], fill)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(ink, fill)).toBeGreaterThanOrEqual(AA);
    });
  });

  // The primary action is the inverse pill: a light fill with a dark label, in both schemes.
  describe("filled primary buttons", () => {
    it.each([
      ["the primary color", full.primaryColor],
      ["english", "english"],
    ])("is the inverse pill for %s", (_name, color) => {
      const result = full.variantColorResolver({
        variant: "filled",
        theme: full,
        color,
      });
      expect(result.background).toBe("var(--parlo-text)");
      expect(result.color).toBe("var(--parlo-on-accent)");
    });

    it("has a readable label", () => {
      expect(contrastRatio("#15141b", "#f3f1f8")).toBeGreaterThanOrEqual(AA);
    });

    it("leaves other colors alone", () => {
      const result = full.variantColorResolver({
        variant: "filled",
        theme: full,
        color: "red",
      });
      expect(result.background).not.toBe("var(--parlo-text)");
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
        color: "french",
      });
      expect(filled.background).not.toContain("light-dark");
    });
  });
});
