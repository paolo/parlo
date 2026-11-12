"use client";

import { Button, Popover } from "@mantine/core";
import { IconSparkles, IconTextSpellcheck } from "@tabler/icons-react";
import { useState } from "react";
import type { Lang } from "../shared/languages";
import classes from "./CorrectionPill.module.css";

/**
 * Marks a phrase whose correction is applied ("Corrected") or set aside ("Suggestion"). It opens a bubble over
 * the cards, so nothing moves, with what was typed or suggested, why, and a button to switch.
 */
export function CorrectionPill({
  correction,
  typed,
  lang,
  applied,
  onChange,
  animate = false,
}: {
  correction: { text: string; explanation: string };
  /** What the user typed. */
  typed: string;
  /** The phrase's language, for the phrases in the bubble. */
  lang: Lang;
  applied: boolean;
  onChange: (applied: boolean) => void;
  /** Pops in, as when the correction has just arrived. */
  animate?: boolean;
}) {
  const [opened, setOpened] = useState(false);
  const Icon = applied ? IconTextSpellcheck : IconSparkles;

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      withinPortal
      classNames={{ dropdown: classes.dropdown }}
    >
      <Popover.Target>
        <button
          type="button"
          className={`${classes.pill} ${animate ? classes.arrive : ""}`}
          onClick={() => setOpened((o) => !o)}
          aria-expanded={opened}
        >
          <Icon size={13} stroke={1.8} aria-hidden />
          {applied ? "Corrected" : "Suggestion"}
        </button>
      </Popover.Target>
      <Popover.Dropdown>
        <p className={classes.caption}>{applied ? "You typed" : "Suggested"}</p>
        <p className={classes.phrase}>
          {applied ? (
            <s lang={lang} dir="auto">
              {typed}
            </s>
          ) : (
            <strong lang={lang} dir="auto">
              {correction.text}
            </strong>
          )}
        </p>
        <p className={classes.explanation}>{correction.explanation}</p>
        <Button
          variant="outline"
          onClick={() => {
            setOpened(false);
            onChange(!applied);
          }}
        >
          {applied ? "Keep what I typed" : "Use the correction"}
        </Button>
      </Popover.Dropdown>
    </Popover>
  );
}
