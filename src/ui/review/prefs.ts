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
