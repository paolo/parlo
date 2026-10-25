import {
  type CSSVariablesResolver,
  colorsTuple,
  createTheme,
  defaultVariantColorsResolver,
  type MantineColorsTuple,
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

/** Ten shades: the role color everywhere, except shade 6, the darker one that reads as text on a light ground. */
function roleTuple(role: string, strong: string): MantineColorsTuple {
  const tuple = [...colorsTuple(role)];
  tuple[6] = strong;
  return tuple as unknown as MantineColorsTuple;
}

export const theme = createTheme({
  // The accent only colors focus rings, links and checkboxes.
  // Dark text on the light role colors, light text on dark ones.
  autoContrast: true,
  primaryColor: "english",
  // Dark uses the role colors as they are (shade 5); light uses the darker text-safe versions (shade 6).
  primaryShade: { light: 6, dark: 5 },
  colors: {
    // The three language roles. Values mirror --parlo-native / -english / -french and their -strong versions
    // in tokens.css (Mantine needs hex values here, not variables).
    native: roleTuple("#ffb38a", "#a64a16"),
    english: roleTuple("#b9a6ff", "#5b44d6"),
    french: roleTuple("#8fe3c3", "#1d7a5c"),
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
        hover: "var(--parlo-text-soft)",
        // The label is the ground color: dark on the light pill in dark mode, light on the dark pill in light mode.
        color: "var(--parlo-ground)",
        hoverColor: "var(--parlo-ground)",
      };
    }
    return result;
  },
  // 16px inputs: iOS Safari zooms into anything smaller when it gets focus.
  components: {
    // filled is the primary pill, default the secondary, outline the ghost.
    Button: {
      // The color is explicit: without it Mantine leaves the fill to its stylesheet, which ignores the resolver.
      defaultProps: { radius: "xl", size: "md", color: "english" },
      // Everything pressable is at least 44px.
      styles: { root: { minHeight: "var(--parlo-size-touch)" } },
    },
    ActionIcon: { defaultProps: { size: 44, radius: "xl" } },
    SegmentedControl: { defaultProps: { radius: "xl", size: "md" } },
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

// Passed to MantineProvider (it is a provider prop, not a theme field). The --parlo-* tokens already change with
// the scheme, so both schemes point Mantine's variables at them; only "default" differs, because a default
// surface is a chip in the dark scheme and a white card on the light ground.
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--mantine-color-body": "var(--parlo-ground)",
    "--mantine-color-text": "var(--parlo-text)",
    "--mantine-color-dimmed": "var(--parlo-text-muted)",
    "--mantine-color-default": "var(--parlo-surface)",
    "--mantine-color-default-border": "var(--parlo-border-strong)",
    "--mantine-color-placeholder": "var(--parlo-text-placeholder)",
  },
  dark: {
    "--mantine-color-default": "var(--parlo-surface-chip)",
    "--mantine-color-default-border": "var(--parlo-border-subtle)",
    "--mantine-color-placeholder": "var(--parlo-text-placeholder)",
  },
});
