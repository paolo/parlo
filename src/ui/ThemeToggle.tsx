"use client";

import {
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import classes from "./ThemeToggle.module.css";

/**
 * Switches between light and dark. Until someone uses it the page follows the system setting; after that Mantine
 * keeps their choice in localStorage, and its ColorSchemeScript (in the root layout) applies it before the first
 * paint, so a returning visitor never sees a flash of the other theme.
 */
export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  // Read after mount: on the server the system setting is not known.
  const scheme = useComputedColorScheme("dark", {
    getInitialValueInEffect: true,
  });

  return (
    <ActionIcon
      variant="default"
      // The label names the action and does not depend on the scheme, so server and client markup agree.
      aria-label="Toggle light and dark theme"
      onClick={() => setColorScheme(scheme === "dark" ? "light" : "dark")}
    >
      <IconSun
        className={classes.sun}
        size={20}
        stroke={1.8}
        aria-hidden="true"
      />
      <IconMoon
        className={classes.moon}
        size={20}
        stroke={1.8}
        aria-hidden="true"
      />
    </ActionIcon>
  );
}
