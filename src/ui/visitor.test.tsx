import { afterEach, describe, expect, it, vi } from "vitest";
import { LANG_CODES } from "../shared/languages";
import {
  clearVisitorNative,
  loadVisitorNative,
  saveVisitorNative,
  VISITOR_ALSO,
  VISITOR_NATIVES,
  visitorLanguages,
} from "./visitor";

const KEY = "parlo.visitor";

describe("the visitor's native pick", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("round-trips a language with its country", () => {
    saveVisitorNative({ lang: "es", region: "BO" });

    expect(loadVisitorNative()).toEqual({ lang: "es", region: "BO" });
  });

  it("reads a pick saved as just a language, with that language's default country", () => {
    window.localStorage.setItem(KEY, JSON.stringify("uk"));

    expect(loadVisitorNative()).toEqual({ lang: "uk", region: "UA" });
  });

  it("falls back to the default country when the stored one does not fit the language", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ lang: "es", region: "JP" }),
    );

    expect(loadVisitorNative()).toEqual({ lang: "es", region: "ES" });
  });

  it("accepts English and French, as languages to start from", () => {
    saveVisitorNative({ lang: "en", region: "NG" });
    expect(loadVisitorNative()).toEqual({ lang: "en", region: "NG" });

    window.localStorage.setItem(KEY, JSON.stringify("fr"));
    expect(loadVisitorNative()).toEqual({ lang: "fr", region: "FR" });
  });

  it("is null when nothing is stored", () => {
    expect(loadVisitorNative()).toBeNull();
  });

  it.each([
    ["garbage", "not json{"],
    ["an unknown code", JSON.stringify("zz")],
    ["a number", "42"],
    ["null", "null"],
    ["an object without a language", JSON.stringify({ region: "BO" })],
  ])("is null for %s", (_name, stored) => {
    window.localStorage.setItem(KEY, stored);

    expect(loadVisitorNative()).toBeNull();
  });

  it("clears the pick", () => {
    saveVisitorNative({ lang: "es", region: "BO" });
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
    expect(() => saveVisitorNative({ lang: "es", region: "BO" })).not.toThrow();
    expect(() => clearVisitorNative()).not.toThrow();
  });

  it("lists every language except English and French as the main picks, and those two as the other way in", () => {
    expect(VISITOR_NATIVES).toEqual(
      LANG_CODES.filter((lang) => lang !== "en" && lang !== "fr"),
    );
    expect(VISITOR_NATIVES).toContain("es");
    expect(VISITOR_ALSO).toEqual(["en", "fr"]);
  });

  it("puts the pick first with its country, English (Canada) second and French (France) third", () => {
    expect(visitorLanguages({ lang: "es", region: "BO" })).toEqual([
      { lang: "es", region: "BO", level: "native", position: 0 },
      { lang: "en", region: "CA", level: "intermediate", position: 1 },
      { lang: "fr", region: "FR", level: "intermediate", position: 2 },
    ]);
  });

  it("brings an English speaker to French and Spanish", () => {
    expect(visitorLanguages({ lang: "en", region: "NG" })).toEqual([
      { lang: "en", region: "NG", level: "native", position: 0 },
      { lang: "fr", region: "FR", level: "intermediate", position: 1 },
      { lang: "es", region: "ES", level: "intermediate", position: 2 },
    ]);
  });

  it("brings a French speaker to English (Canada) and Spanish", () => {
    expect(visitorLanguages({ lang: "fr", region: "HT" })).toEqual([
      { lang: "fr", region: "HT", level: "native", position: 0 },
      { lang: "en", region: "CA", level: "intermediate", position: 1 },
      { lang: "es", region: "ES", level: "intermediate", position: 2 },
    ]);
  });
});
