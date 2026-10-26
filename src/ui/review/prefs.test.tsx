import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  countAllowed,
  DEFAULT_PREFS,
  dealtCount,
  loadPrefs,
  resolveCount,
  resolveSource,
  savePrefs,
} from "./prefs";

const KEY = "parlo.practice";

describe("practice prefs", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("defaults to Starter and 10 cards on a first visit", () => {
    expect(loadPrefs()).toEqual({ source: "starter", count: 10 });
    expect(DEFAULT_PREFS).toEqual({ source: "starter", count: 10 });
  });

  it("round-trips a saved choice", () => {
    savePrefs({ source: "recent", count: 20 });
    expect(loadPrefs()).toEqual({ source: "recent", count: 20 });
  });

  it("falls back to the defaults for garbage", () => {
    window.localStorage.setItem(KEY, "{not json");
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });

  it("falls back field by field for unknown values", () => {
    window.localStorage.setItem(KEY, '{"source":"nope","count":7}');
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    window.localStorage.setItem(KEY, '{"source":"favorites","count":7}');
    expect(loadPrefs()).toEqual({ source: "favorites", count: 10 });
  });

  it("survives storage that throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    expect(() => savePrefs({ source: "recent", count: 5 })).not.toThrow();
  });

  it("falls back to Starter when Favorites is chosen but empty", () => {
    const favorites = { source: "favorites", count: 5 } as const;
    expect(resolveSource(favorites, 0)).toBe("starter");
    expect(resolveSource(favorites, 3)).toBe("favorites");
    expect(resolveSource({ source: "recent", count: 5 }, 0)).toBe("recent");
  });

  it("ignores an old All count", () => {
    window.localStorage.setItem(KEY, '{"source":"starter","count":"all"}');
    expect(loadPrefs()).toEqual({ source: "starter", count: 10 });
  });

  it("uses the biggest count that fits when the chosen one is more than the source has", () => {
    expect(resolveCount(20, 12)).toBe(10);
    expect(resolveCount(10, 6)).toBe(5);
    expect(resolveCount(5, 6)).toBe(5);
    expect(resolveCount(20, 100)).toBe(20);
  });

  it("always allows the smallest count, even for a tiny source", () => {
    expect(countAllowed(5, 3)).toBe(true);
    expect(countAllowed(10, 3)).toBe(false);
    expect(resolveCount(20, 3)).toBe(5);
    expect(resolveCount(5, 0)).toBe(5);
  });

  it("deals the chosen number, or every phrase when there are fewer", () => {
    expect(dealtCount(10, 6)).toBe(6);
    expect(dealtCount(5, 6)).toBe(5);
    expect(dealtCount(5, 3)).toBe(3);
  });
});
