import { Group, Paper, Text } from "@mantine/core";

interface PhraseBubbleProps {
  /** BCP 47 tag of the phrase, so the browser picks the right glyph shapes. */
  lang: string;
  /** Short language label shown above the phrase, e.g. "UK". */
  label: string;
  text: string;
  /** The side the speaker is on; the small-radius corner (the "tail") points that way. */
  side: "left" | "right";
}

const TAIL_RADIUS = {
  left: "18px 18px 18px 4px",
  right: "18px 18px 4px 18px",
} as const;

export function PhraseBubble({ lang, label, text, side }: PhraseBubbleProps) {
  return (
    <Group justify={side === "left" ? "flex-start" : "flex-end"} wrap="nowrap">
      {/* Two lines of phrase plus the label: enough that rotating phrases never change the height. */}
      <Paper
        shadow="sm"
        px="md"
        py="sm"
        maw="80%"
        mih={84}
        bdrs={TAIL_RADIUS[side]}
      >
        <Text size="xs" fw={700} c="parlo">
          {label}
        </Text>
        <Text fw={700} lang={lang} dir="auto">
          {text}
        </Text>
      </Paper>
    </Group>
  );
}
