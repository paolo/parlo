import { DEFAULT_THEME, mergeMantineTheme } from "@mantine/core";
import { describe, expect, it } from "vitest";
import { cssVariablesResolver, theme } from "./theme";

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
    it("uses lilac as the accent", () => {
      expect(theme.primaryColor).toBe("english");
      expect(theme.colors?.english?.[0]).toBe("#b9a6ff");
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

    it("makes icon buttons 44px round targets", () => {
      const props = theme.components?.ActionIcon?.defaultProps;
      expect(props?.size).toBe(44);
      expect(props?.radius).toBe("xl");
    });

    it("makes buttons pills with the primary color set, so the resolver decides the fill", () => {
      const props = theme.components?.Button?.defaultProps;
      expect(props?.radius).toBe("xl");
      expect(props?.color).toBe(theme.primaryColor);
    });
  });

  // The --parlo-* tokens (and their contrast) are tested in src/styles/tokens.test.ts.
  describe("cssVariablesResolver", () => {
    const { light, dark } = cssVariablesResolver(full);

    it("points both schemes at the parlo tokens", () => {
      expect(light["--mantine-color-body"]).toBe("var(--parlo-ground)");
      expect(light["--mantine-color-text"]).toBe("var(--parlo-text)");
      expect(dark["--mantine-color-default"]).toBe("var(--parlo-surface-chip)");
      expect(light["--mantine-color-default"]).toBe("var(--parlo-surface)");
    });
  });

  describe("primary shade", () => {
    it("uses the role colors in dark and their darker text-safe shade in light", () => {
      expect(theme.primaryShade).toEqual({ light: 6, dark: 5 });
      expect(theme.colors?.english?.[5]).toBe("#b9a6ff");
      expect(theme.colors?.english?.[6]).toBe("#5b44d6");
      expect(theme.colors?.native?.[6]).toBe("#a64a16");
      expect(theme.colors?.french?.[6]).toBe("#1d7a5c");
    });
  });

  // The primary action is the inverse pill: the text color as the fill and the ground color as the label, so it inverts with the scheme.
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
      expect(result.color).toBe("var(--parlo-ground)");
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
