"use client";

import {
  Group,
  SegmentedControl,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";

const OPTIONS = [
  { value: "auto", label: "System", icon: IconDeviceDesktop },
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
] as const;

/**
 * System, light or dark. It reads and writes the same stored value as the landing page's toggle (Mantine keeps it
 * in localStorage): the toggle there always picks light or dark, and this is where to go back to following the
 * system.
 */
export function ThemeSetting() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  return (
    <Stack gap="xs">
      <div>
        <Title order={3}>Appearance</Title>
        <Text c="dimmed">
          System follows your device. Your choice is remembered in this browser.
        </Text>
      </div>
      <SegmentedControl
        aria-label="Theme"
        value={colorScheme}
        onChange={(value) => setColorScheme(value as typeof colorScheme)}
        data={OPTIONS.map(({ value, label, icon: Icon }) => ({
          value,
          label: (
            <Group gap={6} justify="center" wrap="nowrap">
              <Icon size={18} stroke={1.8} aria-hidden="true" />
              {label}
            </Group>
          ),
        }))}
        w="fit-content"
        maw="100%"
      />
    </Stack>
  );
}
