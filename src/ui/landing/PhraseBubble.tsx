import { Group, Paper, Stack, Text } from "@mantine/core";

interface PhraseBubbleProps {
  /** BCP 47 tag of the phrase, so the browser picks the right glyph shapes. */
  lang: string;
  /** Flag emoji shown above the phrase. */
  flag: string;
  /** What the flag stands for, e.g. "Spanish (Bolivia)", since a flag emoji alone says nothing to a screen reader. */
  flagName: string;
  text: string;
  /** The side the speaker is on; the small-radius corner (the "tail") points that way. */
  side: "left" | "right";
}

const TAIL_RADIUS = {
  left: "18px 18px 18px 4px",
  right: "18px 18px 4px 18px",
} as const;

export function PhraseBubble({
  lang,
  flag,
  flagName,
  text,
  side,
}: PhraseBubbleProps) {
  return (
    <Group justify={side === "left" ? "flex-start" : "flex-end"} wrap="nowrap">
      {/* Two lines of phrase plus the label: enough that rotating phrases never change the height. */}
      <Paper
        shadow="sm"
        px="md"
        py="sm"
        miw="60%"
        maw="80%"
        bdrs={TAIL_RADIUS[side]}
      >
        <Stack gap={0} mih={74} justify="center">
          <Text span role="img" aria-label={flagName} size="lg" lh={1.3}>
            {flag}
          </Text>
          <Text fw={700} lang={lang} dir="auto">
            {text}
          </Text>
        </Stack>
      </Paper>
    </Group>
  );
}
