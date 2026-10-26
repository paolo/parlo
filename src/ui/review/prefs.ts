export type Source = "favorites" | "recent" | "starter";
export const COUNTS = [5, 10, 20] as const;
export type Count = (typeof COUNTS)[number];

export interface PracticePrefs {
  source: Source;
  count: Count;
}

export const DEFAULT_PREFS: PracticePrefs = { source: "starter", count: 10 };

const KEY = "parlo.practice";
const SOURCES: readonly Source[] = ["favorites", "recent", "starter"];

/** How many cards a round deals: the count, or every phrase when the source has fewer. */
export function dealtCount(count: Count, available: number): number {
  return Math.min(count, available);
}

/** Whether a count can be picked: the smallest always can, so a tiny source still has a selection. */
export function countAllowed(count: Count, available: number): boolean {
  return count === COUNTS[0] || count <= available;
}

/** The count in effect for a source of `available` phrases: the chosen one, or the biggest that still fits. */
export function resolveCount(count: Count, available: number): Count {
  if (countAllowed(count, available)) return count;
  return (
    [...COUNTS].reverse().find((c) => countAllowed(c, available)) ?? COUNTS[0]
  );
}

/** The last choice, field by field; anything missing, unknown or unreadable falls back to the default. */
export function loadPrefs(): PracticePrefs {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "");
    const { source, count } = (saved ?? {}) as Partial<PracticePrefs>;
    return {
      source: SOURCES.find((s) => s === source) ?? DEFAULT_PREFS.source,
      count: COUNTS.find((c) => c === count) ?? DEFAULT_PREFS.count,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: PracticePrefs): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Storage can be blocked; the choice just isn't remembered.
  }
}

/** Favorites with nothing in it can't be practiced, so a user with none starts on Starter. */
export function resolveSource(
  prefs: PracticePrefs,
  favoritesCount: number,
): Source {
  return prefs.source === "favorites" && favoritesCount === 0
    ? "starter"
    : prefs.source;
}
