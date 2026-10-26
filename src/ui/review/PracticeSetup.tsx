import { Badge, Button, SegmentedControl, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";
import classes from "./PracticeSetup.module.css";
import { COUNTS, type Count, type Source } from "./prefs";

export const SOURCE_LABELS: Record<Source, string> = {
  favorites: "Favorites",
  recent: "Recent",
  starter: "Starter",
};

/** A labelled group of setup controls. */
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Stack gap={8}>
      <Text size="sm" fw={600} c="dimmed">
        {label}
      </Text>
      {children}
    </Stack>
  );
}

/**
 * What to practice and how many cards, then the one primary action. `counts` is how many phrases each source
 * has (undefined while it loads); a number of cards bigger than the chosen source has is disabled. The way to
 * answer and the languages come in as children.
 */
export function PracticeSetup({
  source,
  count,
  counts,
  onSource,
  onCount,
  onStart,
  children,
}: {
  source: Source;
  /** The count in effect, already limited to what the source has. */
  count: Count;
  counts: Record<Source, number | undefined>;
  onSource: (source: Source) => void;
  onCount: (count: Count) => void;
  onStart: () => void;
  children: ReactNode;
}) {
  const available = counts[source] ?? Number.POSITIVE_INFINITY;
  return (
    <Stack gap="lg" className={classes.panel}>
      <Field label="Cards from">
        <SegmentedControl
          fullWidth
          aria-label="Where cards come from"
          value={source}
          onChange={(next) => onSource(next as Source)}
          data={(Object.keys(SOURCE_LABELS) as Source[]).map((value) => ({
            value,
            label: (
              <>
                {SOURCE_LABELS[value]}
                {counts[value] !== undefined && (
                  <>
                    {" "}
                    <span className={classes.count}>{counts[value]}</span>
                  </>
                )}
              </>
            ),
          }))}
        />
      </Field>
      <Field label="Cards this round">
        <SegmentedControl
          fullWidth
          aria-label="Cards this round"
          value={String(count)}
          onChange={(next) =>
            onCount(next === "all" ? "all" : (Number(next) as Count))
          }
          data={COUNTS.map((n) => ({
            value: String(n),
            label: n === "all" ? "All" : String(n),
            disabled: n !== "all" && n > available,
          }))}
        />
      </Field>
      {children}
      <Button size="lg" fullWidth onClick={onStart}>
        Start
      </Button>
    </Stack>
  );
}

/** The ways to answer. Speaking is on the way, so it shows, disabled, with a tag. */
export function AnswerModeSelect({
  value,
  onChange,
}: {
  value: "flip" | "type";
  onChange: (mode: "flip" | "type") => void;
}) {
  return (
    <SegmentedControl
      fullWidth
      aria-label="How to practice"
      value={value}
      onChange={(next) => onChange(next as "flip" | "type")}
      data={[
        { value: "flip", label: "Flip cards" },
        { value: "type", label: "Type it" },
        {
          value: "speak",
          disabled: true,
          label: (
            <>
              Say it{" "}
              <Badge size="xs" variant="default" component="span">
                Soon
              </Badge>
            </>
          ),
        },
      ]}
    />
  );
}
