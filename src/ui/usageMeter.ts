export type MeterLevel = "ok" | "low" | "out";

/** The ring turns amber when this share of the allowance (or less) is left. */
export const LOW_SHARE = 0.2;

/** How much of today's allowance is left, and how worried the ring should look about it. */
export function meterState(
  used: number,
  limit: number,
): { remaining: number; share: number; level: MeterLevel } {
  const remaining = Math.max(0, limit - used);
  const share = limit > 0 ? remaining / limit : 0;
  const level: MeterLevel =
    remaining === 0 ? "out" : share <= LOW_SHARE ? "low" : "ok";
  return { remaining, share, level };
}
