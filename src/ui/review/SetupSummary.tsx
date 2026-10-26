import { Button, Group, Text } from "@mantine/core";
import { SOURCE_LABELS } from "./PracticeSetup";
import type { Count, Source } from "./prefs";

/** One line that stands in for the setup once practice has started, so the card keeps its place. */
export function SetupSummary({
  source,
  count,
  onChange,
}: {
  source: Source;
  count: Count;
  onChange: () => void;
}) {
  return (
    <Group justify="space-between" gap="sm" wrap="nowrap">
      <Text fw={600} size="sm">
        {SOURCE_LABELS[source]} · {count} cards
      </Text>
      <Button variant="subtle" onClick={onChange}>
        Change
      </Button>
    </Group>
  );
}
