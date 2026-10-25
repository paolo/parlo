import {
  type CSSVariablesResolver,
  colorsTuple,
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

export const theme = createTheme({
  // The accent only colors focus rings, links and checkboxes: a single lilac, so every shade is the same.
  primaryColor: "english",
  primaryShade: 5,
  colors: {
    // The three language roles. Their values also live in tokens.css as --parlo-native / -english / -french.
    native: colorsTuple("#ffb38a"),
    english: colorsTuple("#b9a6ff"),
    french: colorsTuple("#8fe3c3"),
    // Mantine reads dark[0] as text, [2] as dimmed text, [4] as borders, [5] as chips, [6] as surfaces and [7] as the page.
    dark: [
      "#f3f1f8",
      "#c9c6d6",
      "#a9a6b8",
      "#8b8899",
      "#3a3944",
      "#2a2933",
      "#1f1e27",
      "#15141b",
      "#111016",
      "#0c0b10",
    ],
  },
  // Cards and inputs are rounded rectangles; buttons and chips opt into "xl" (a pill).
  defaultRadius: "md",
  radius: { xs: "16px", sm: "22px", md: "26px", lg: "28px", xl: "999px" },
  fontFamily: "var(--parlo-font-sans)",
  headings: {
    fontFamily: "var(--parlo-font-display)",
    fontWeight: "800",
  },
  variantColorResolver: (input) => {
    if (input.variant === "google") {
      return { ...GOOGLE, hoverColor: GOOGLE.color };
    }
    const result = defaultVariantColorsResolver(input);
    if (
      input.variant === "filled" &&
      input.color === input.theme.primaryColor
    ) {
      // The primary action is the inverse pill: a light fill with a dark label.
      return {
        ...result,
        background: "var(--parlo-text)",
        hover: "#ffffff",
        color: "var(--parlo-on-accent)",
        hoverColor: "var(--parlo-on-accent)",
      };
    }
    return result;
  },
  // 16px inputs: iOS Safari zooms into anything smaller when it gets focus.
  components: {
    // filled is the primary pill, default the secondary, outline the ghost.
    Button: { defaultProps: { radius: "xl", size: "md" } },
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
    Title: { styles: { root: { letterSpacing: "-0.025em" } } },
  },
});

// Passed to MantineProvider (it is a provider prop, not a theme field). The dark scheme gets its page, text and
// dimmed colors from `colors.dark`; the light values below are placeholders until the light-mode task.
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--mantine-color-body": "#f4f5fb",
    "--mantine-color-text": "#1d2033",
    "--mantine-color-dimmed": "#62678a",
  },
  dark: {
    "--mantine-color-default": "var(--parlo-surface-chip)",
    "--mantine-color-default-border": "var(--parlo-border-subtle)",
    "--mantine-color-placeholder": "var(--parlo-text-placeholder)",
  },
});
