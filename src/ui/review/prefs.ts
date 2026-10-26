export type Source = "favorites" | "recent" | "starter";
export const COUNTS = [5, 10, 20, "all"] as const;
export type Count = (typeof COUNTS)[number];

export interface PracticePrefs {
  source: Source;
  count: Count;
}

export const DEFAULT_PREFS: PracticePrefs = { source: "starter", count: 10 };

const KEY = "parlo.practice";
const SOURCES: readonly Source[] = ["favorites", "recent", "starter"];

/** How many cards a round deals when the source has that many: a number is only offered up to the source's size. */
export function dealtCount(count: Count, available: number): number {
  return count === "all" ? available : Math.min(count, available);
}

/** The count to use for a source of `available` phrases: the chosen one, or All when it asks for more than exist. */
export function resolveCount(count: Count, available: number): Count {
  return count !== "all" && count > available ? "all" : count;
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
