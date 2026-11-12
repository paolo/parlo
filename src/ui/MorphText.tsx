"use client";

import { useReducedMotion } from "@mantine/hooks";
import classes from "./MorphText.module.css";
import { diffChars } from "./textDiff";

/**
 * Shows `to`, animating the change from `from`: letters only in `from` fold away and letters only in `to` spring
 * in. Nothing of the change stays once the animation ends. With reduced motion it shows `to` alone.
 */
export function MorphText({ from, to }: { from: string; to: string }) {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return <>{to}</>;
  return (
    <>
      <span aria-hidden="true">
        {diffChars(from, to).map((part, index) => (
          <span
            // The parts of one diff never reorder.
            // biome-ignore lint/suspicious/noArrayIndexKey: see above
            key={index}
            data-kind={part.kind}
            className={`${classes.part} ${part.kind === "same" ? "" : classes[part.kind]}`}
          >
            {part.text}
          </span>
        ))}
      </span>
      <span className={classes.final}>{to}</span>
    </>
  );
}
