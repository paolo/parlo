import { Group, Paper, Stack, Text } from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";

/** How long a bubble takes to slide out or in; the conversation waits this long before swapping phrases. */
export const SLIDE_MS = 200;
const SLIDE_PX = 48;

interface PhraseBubbleProps {
  /** BCP 47 tag of the phrase, so the browser picks the right glyph shapes. */
  lang: string;
  /** Flag emoji shown above the phrase. */
  flag: string;
  /** What the flag stands for, e.g. "Spanish (Bolivia)", since a flag emoji alone says nothing to a screen reader. */
  flagName: string;
  text: string;
  /** The side the speaker is on; the small-radius corner (the "tail") points that way and the content aligns to it. */
  side: "left" | "right";
  /** True while the bubble is slid out to its own side, between two phrases. */
  exited: boolean;
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
  exited,
}: PhraseBubbleProps) {
  const reducedMotion = useReducedMotion();
  const away = side === "left" ? -SLIDE_PX : SLIDE_PX;
  return (
    <Group
      data-side={side}
      justify={side === "left" ? "flex-start" : "flex-end"}
      wrap="nowrap"
      style={{
        transform: `translateX(${exited ? away : 0}${exited ? "px" : ""})`,
        opacity: exited ? 0 : 1,
        transition: reducedMotion
          ? undefined
          : `transform ${SLIDE_MS}ms ease, opacity ${SLIDE_MS}ms ease`,
      }}
    >
      {/* Two lines of phrase plus the flag: enough that rotating phrases never change the height. */}
      <Paper
        shadow="sm"
        px="md"
        py="sm"
        miw="60%"
        maw="80%"
        bdrs={TAIL_RADIUS[side]}
      >
        <Stack
          gap={0}
          mih={74}
          justify="center"
          align={side === "left" ? "flex-start" : "flex-end"}
        >
          <Text span role="img" aria-label={flagName} size="lg" lh={1.3}>
            {flag}
          </Text>
          <Text
            fw={700}
            lang={lang}
            dir="auto"
            ta={side === "left" ? "left" : "right"}
          >
            {text}
          </Text>
        </Stack>
      </Paper>
    </Group>
  );
}
