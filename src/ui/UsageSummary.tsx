import classes from "./UsageSummary.module.css";
import { meterState } from "./usageMeter";

/** What the avatar ring means, in words: the count in the ring's color, a bar that mirrors it, and the reset time. */
export function UsageSummary({
  used,
  limit,
  resetAt,
}: {
  used: number;
  limit: number;
  resetAt: string;
}) {
  const { remaining, share, level } = meterState(used, limit);
  const resetTime = new Date(resetAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className={classes.summary} data-level={level}>
      <span className={classes.count}>
        {remaining} of {limit} translations left today
      </span>
      <div className={classes.bar} aria-hidden="true">
        <div
          className={classes.fill}
          style={{ width: `${(level === "out" ? 1 : share) * 100}%` }}
        />
      </div>
      <span className={classes.reset}>Resets at {resetTime}</span>
    </div>
  );
}
