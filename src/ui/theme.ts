import {
  type CSSVariablesResolver,
  createTheme,
  defaultVariantColorsResolver,
  rem,
} from "@mantine/core";

// Light on the left, dark on the right: Google's sign-in button branding.
// The pair is joined with CSS light-dark() so the scheme swap needs no JavaScript.
const GOOGLE = {
  background: "light-dark(#FFFFFF, #131314)",
  hover: "light-dark(#F1F3F4, #1F1F20)",
  color: "light-dark(#1F1F1F, #E3E3E3)",
  // Mantine uses this as the whole `border` shorthand, so it needs the width and style too.
  border: `${rem(1)} solid light-dark(#747775, #8E918F)`,
};

const FILLED_PRIMARY_TEXT =
  "light-dark(var(--mantine-color-white), var(--mantine-color-black))";

export const theme = createTheme({
  primaryColor: "parlo",
  primaryShade: { light: 6, dark: 4 },
  colors: {
    // Shade 6 is the accent on light backgrounds, shade 4 on dark ones.
    parlo: [
      "#eef0fe",
      "#dde1fc",
      "#c3caf9",
      "#a8b2f7",
      "#8f9cf5",
      "#6b7be0",
      "#4c5fd5",
      "#3f50bb",
      "#34429d",
      "#2a3680",
    ],
    // Mantine reads dark[0] as text, [2] as dimmed text, [4] as borders, [6] as surfaces and [7] as the page.
    dark: [
      "#eceefb",
      "#c3c7e6",
      "#8d93b8",
      "#6d739c",
      "#4d5280",
      "#373b69",
      "#21244a",
      "#14162a",
      "#0f1122",
      "#0a0b18",
    ],
  },
  defaultRadius: "md",
  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  fontFamilyMonospace: "var(--font-geist-mono), ui-monospace, monospace",
  headings: {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    fontWeight: "800",
  },
  variantColorResolver: (input) => {
    if (input.variant === "google") {
      return { ...GOOGLE, hoverColor: GOOGLE.color };
    }
    const result = defaultVariantColorsResolver(input);
    if (input.variant === "filled" && input.color === "parlo") {
      // Shade 4 (the dark scheme's primary) is too light for white text; see theme.test.ts.
      return {
        ...result,
        color: FILLED_PRIMARY_TEXT,
        hoverColor: FILLED_PRIMARY_TEXT,
      };
    }
    return result;
  },
  // 16px inputs: iOS Safari zooms into anything smaller when it gets focus.
  components: {
    Textarea: { defaultProps: { size: "md" } },
    TextInput: { defaultProps: { size: "md" } },
    PasswordInput: { defaultProps: { size: "md" } },
    Select: { defaultProps: { size: "md" } },
    // Plain objects, not Paper.extend(...): this file is also imported by server code (the preview image),
    // where Mantine components are client references without an `extend`.
    // The page is tinted, so surfaces are white (light) or one step lighter than the page (dark).
    Paper: {
      styles: {
        root: {
          backgroundColor:
            "light-dark(var(--mantine-color-white), var(--mantine-color-dark-6))",
        },
      },
    },
    Title: { styles: { root: { letterSpacing: "-0.02em" } } },
  },
});

// Passed to MantineProvider (it is a provider prop, not a theme field). The dark scheme gets its
// page, text and dimmed colors from `colors.dark`; only the light scheme needs overriding.
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--mantine-color-body": "#f4f5fb",
    "--mantine-color-text": "#1d2033",
    "--mantine-color-dimmed": "#62678a",
  },
  dark: {},
});
