export type LimitDecision =
  | { ok: true }
  | { ok: false; reason: "daily" | "burst"; resetAt: Date };

export const BURST_WINDOW_MS = 60_000;

/** The start of the next UTC day. Quotas reset at UTC midnight for everyone. */
export function nextUtcMidnight(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
}

export function startOfUtcDay(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/** Pure rate-limit decision. The daily limit wins when both apply, since it blocks for longer. */
export function decide(input: {
  todayCount: number;
  minuteCount: number;
  dailyLimit: number;
  burstLimit: number;
  now: Date;
}): LimitDecision {
  if (input.todayCount >= input.dailyLimit) {
    return { ok: false, reason: "daily", resetAt: nextUtcMidnight(input.now) };
  }
  if (input.minuteCount >= input.burstLimit) {
    // Conservative: a full window from now. Precise would be oldest-in-window + 60s; fine for now.
    return {
      ok: false,
      reason: "burst",
      resetAt: new Date(input.now.getTime() + BURST_WINDOW_MS),
    };
  }
  return { ok: true };
}
