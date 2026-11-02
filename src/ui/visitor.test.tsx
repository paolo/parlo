import { afterEach, describe, expect, it, vi } from "vitest";
import { LANG_CODES } from "../shared/languages";
import {
  clearVisitorNative,
  loadVisitorNative,
  saveVisitorNative,
  VISITOR_NATIVES,
  visitorLanguages,
} from "./visitor";

const KEY = "parlo.visitor";

describe("the visitor's native pick", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("round-trips a valid pick", () => {
    saveVisitorNative("uk");

    expect(loadVisitorNative()).toBe("uk");
  });

  it("is null when nothing is stored", () => {
    expect(loadVisitorNative()).toBeNull();
  });

  it.each([
    ["garbage", "not json{"],
    ["English", JSON.stringify("en")],
    ["French", JSON.stringify("fr")],
    ["an unknown code", JSON.stringify("zz")],
    ["a number", "42"],
    ["null", "null"],
  ])("is null for %s", (_name, stored) => {
    window.localStorage.setItem(KEY, stored);

    expect(loadVisitorNative()).toBeNull();
  });

  it("clears the pick", () => {
    saveVisitorNative("es");
    clearVisitorNative();

    expect(loadVisitorNative()).toBeNull();
  });

  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(loadVisitorNative()).toBeNull();
    expect(() => saveVisitorNative("es")).not.toThrow();
    expect(() => clearVisitorNative()).not.toThrow();
  });

  it("offers every language except English and French as the native pick", () => {
    expect(VISITOR_NATIVES).toEqual(
      LANG_CODES.filter((lang) => lang !== "en" && lang !== "fr"),
    );
    expect(VISITOR_NATIVES).toContain("es");
  });

  it("puts the pick first, English (Canada) second and French (France) third", () => {
    expect(visitorLanguages("uk")).toEqual([
      { lang: "uk", region: "UA", level: "native", position: 0 },
      { lang: "en", region: "CA", level: "intermediate", position: 1 },
      { lang: "fr", region: "FR", level: "intermediate", position: 2 },
    ]);
  });
});
