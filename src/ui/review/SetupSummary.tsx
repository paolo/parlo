import { Button, Group, Text } from "@mantine/core";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { SOURCE_LABELS } from "./PracticeSetup";
import type { Source } from "./prefs";

/** One line that stands in for the setup once practice has started, so the card keeps its place. */
export function SetupSummary({
  source,
  cards,
  onSetup,
}: {
  source: Source;
  /** How many cards the round deals. */
  cards: number;
  onSetup: () => void;
}) {
  return (
    <Group justify="space-between" gap="sm" wrap="nowrap">
      <Text fw={600} size="sm">
        {SOURCE_LABELS[source]} · {cards} {cards === 1 ? "card" : "cards"}
      </Text>
      <Button
        variant="default"
        leftSection={<IconAdjustmentsHorizontal size={18} stroke={1.8} />}
        onClick={onSetup}
      >
        Setup
      </Button>
    </Group>
  );
}
