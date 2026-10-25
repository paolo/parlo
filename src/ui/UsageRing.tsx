import type { ReactNode } from "react";
import classes from "./UsageRing.module.css";
import { meterState } from "./usageMeter";

/** `children` (the avatar) with a ring around it that empties as today's allowance is used. */
export function UsageRing({
  used,
  limit,
  children,
}: {
  used: number;
  limit: number;
  children: ReactNode;
}) {
  const { share, level } = meterState(used, limit);
  // Out of allowance: a full ring in the warning color reads better than an empty one.
  const shown = level === "out" ? 1 : share;
  return (
    <span className={classes.wrap} data-level={level}>
      <svg className={classes.svg} viewBox="0 0 52 52" aria-hidden="true">
        <circle className={classes.track} cx="26" cy="26" r="24" />
        <circle
          className={classes.fill}
          cx="26"
          cy="26"
          r="24"
          pathLength={100}
          strokeDasharray={`${shown * 100} 100`}
        />
      </svg>
      {children}
    </span>
  );
}
