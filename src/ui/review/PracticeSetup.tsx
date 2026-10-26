import { Button, SegmentedControl, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { COUNTS, type Count, type Source } from "./prefs";

export const SOURCE_LABELS: Record<Source, string> = {
  favorites: "Favorites",
  recent: "Recent",
  starter: "Starter",
};

/** What to practice and how many cards, then the one primary action. The mode and language controls come in as children. */
export function PracticeSetup({
  source,
  count,
  onSource,
  onCount,
  onStart,
  children,
}: {
  source: Source;
  count: Count;
  onSource: (source: Source) => void;
  onCount: (count: Count) => void;
  onStart: () => void;
  children: ReactNode;
}) {
  return (
    <Stack gap="md" maw={720} align="flex-start">
      <Stack gap={6}>
        <Text size="sm" c="dimmed">
          Cards from
        </Text>
        <SegmentedControl
          aria-label="Where cards come from"
          value={source}
          onChange={(next) => onSource(next as Source)}
          data={(Object.keys(SOURCE_LABELS) as Source[]).map((value) => ({
            value,
            label: SOURCE_LABELS[value],
          }))}
        />
      </Stack>
      <Stack gap={6}>
        <Text size="sm" c="dimmed">
          How many
        </Text>
        <SegmentedControl
          aria-label="How many cards"
          value={String(count)}
          onChange={(next) => onCount(Number(next) as Count)}
          data={COUNTS.map((n) => String(n))}
        />
      </Stack>
      {children}
      <Button onClick={onStart}>Start</Button>
    </Stack>
  );
}
