import { Group, Paper, Stack, Text } from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";
import { Flag } from "../Flag";
import type { Role } from "../roles";

/** How long a bubble takes to slide out or in; the conversation waits this long before swapping phrases. */
export const SLIDE_MS = 200;
const SLIDE_PX = 48;

interface PhraseBubbleProps {
  /** BCP 47 tag of the phrase, so the browser picks the right glyph shapes. */
  lang: string;
  /** ISO 3166-1 alpha-2 region whose flag is shown above the phrase. */
  region: string;
  /** What the flag stands for, e.g. "Spanish (Bolivia)", since a flag alone says nothing to a screen reader. */
  flagName: string;
  text: string;
  /** The side the speaker is on; the small-radius corner (the "tail") points that way and the content aligns to it. */
  side: "left" | "right";
  /** Which language role colors the bubble: native, then the second and third language. */
  langRole: Role;
  /** True while the bubble is slid out to its own side, between two phrases. */
  exited: boolean;
}

const TAIL_RADIUS = {
  left: "18px 18px 18px 4px",
  right: "18px 18px 4px 18px",
} as const;

export function PhraseBubble({
  lang,
  region,
  flagName,
  text,
  side,
  langRole,
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
      {/* Not the `bg` prop: it sets the `background` shorthand, which conflicts with the theme's `backgroundColor` on Paper. */}
      <Paper
        px="md"
        py="sm"
        miw="60%"
        maw="80%"
        bdrs={TAIL_RADIUS[side]}
        style={{
          backgroundColor: `var(--parlo-${langRole})`,
          color: "var(--parlo-on-accent)",
        }}
      >
        <Stack
          gap={0}
          mih={74}
          justify="center"
          align={side === "left" ? "flex-start" : "flex-end"}
        >
          <Flag region={region} alt={flagName} size="1.5rem" />
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
