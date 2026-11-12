"use client";

import { ActionIcon, CopyButton } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import type { CSSProperties, ReactNode } from "react";
import type { PhraseDTO } from "@/server/phrases/types";
import { LangLabel } from "./LangLabel";
import { MorphText } from "./MorphText";
import classes from "./PhraseCard.module.css";
import type { Role } from "./roles";

/**
 * One phrase on a card colored by its language role. Without a role (a language the viewer no longer has) the
 * card is neutral. `index` is the position in a stack: it staggers the entrance and alternates the tilt.
 */
export function PhraseCard({
  phrase,
  langRole,
  index = 0,
  badge,
  morphFrom,
}: {
  phrase: PhraseDTO;
  langRole?: Role;
  index?: number;
  /** Replaces the root's "Original" badge, e.g. with the correction pill. */
  badge?: ReactNode;
  /** The text shown before: when it differs, the phrase animates from it to its own text. */
  morphFrom?: string;
}) {
  return (
    <article
      className={classes.card}
      data-role={langRole}
      style={
        {
          "--delay": `${0.05 + index * 0.13}s`,
          "--tilt": index % 2 === 0 ? "-0.6deg" : "0.5deg",
        } as CSSProperties
      }
    >
      <div className={classes.top}>
        <span className={classes.label}>
          <LangLabel lang={phrase.lang} flagSize="var(--parlo-size-flag-s)" />
          {phrase.isRoot &&
            (badge ?? <span className={classes.badge}>Original</span>)}
        </span>
        <CopyButton value={phrase.text}>
          {({ copied, copy }) => (
            <ActionIcon
              className={classes.icon}
              size={44}
              radius="xl"
              variant="transparent"
              onClick={copy}
              aria-label={copied ? "Copied" : "Copy phrase"}
            >
              {copied ? (
                <IconCheck size={19} stroke={1.8} />
              ) : (
                <IconCopy size={19} stroke={1.8} />
              )}
            </ActionIcon>
          )}
        </CopyButton>
      </div>
      <p className={classes.phrase} lang={phrase.lang} dir="auto">
        {morphFrom !== undefined && morphFrom !== phrase.text ? (
          // Keyed by the change, so a second change restarts the animation.
          <MorphText
            key={`${morphFrom}→${phrase.text}`}
            from={morphFrom}
            to={phrase.text}
          />
        ) : (
          phrase.text
        )}
      </p>
    </article>
  );
}
