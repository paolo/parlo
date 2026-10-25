import classes from "./Wordmark.module.css";

/** "parlo" with the three bobbing language dots. `onLight` uses the -deep dot colors for light surfaces. */
export function Wordmark({
  size = 30,
  onLight = false,
}: {
  size?: number;
  onLight?: boolean;
}) {
  const dot = Math.round(size * 0.23);
  return (
    <span
      className={classes.root}
      data-on-light={onLight || undefined}
      style={{ fontSize: size }}
      role="img"
      aria-label="parlo"
    >
      <span aria-hidden="true">parlo</span>
      <span
        className={classes.dots}
        aria-hidden="true"
        style={{ "--dot": `${dot}px` } as React.CSSProperties}
      >
        <i data-role="native" />
        <i data-role="english" />
        <i data-role="french" />
      </span>
    </span>
  );
}
