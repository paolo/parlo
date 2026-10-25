import { describe, expect, it } from "vitest";
import {
  isRegionOf,
  LANG_CODES,
  LANGUAGES,
  PROFILE_SIZE,
  regionName,
} from "./languages";

describe("language catalog", () => {
  it("has 13 unique codes, each with a catalog entry", () => {
    expect(LANG_CODES).toHaveLength(13);
    expect(new Set(LANG_CODES).size).toBe(13);
    for (const code of LANG_CODES) expect(LANGUAGES[code].code).toBe(code);
  });

  it("makes each language's defaultRegion the first of its regions", () => {
    for (const code of LANG_CODES) {
      const { defaultRegion, regions } = LANGUAGES[code];
      expect(regions[0]).toBe(defaultRegion);
    }
  });

  it("defaults English to GB and French to FR", () => {
    expect(LANGUAGES.en.defaultRegion).toBe("GB");
    expect(LANGUAGES.fr.defaultRegion).toBe("FR");
  });

  it("profiles hold three languages", () => {
    expect(PROFILE_SIZE).toBe(3);
  });
});

describe("region names", () => {
  it("names regions in English", () => {
    expect(regionName("BO")).toBe("Bolivia");
  });

  it("checks that a region belongs to a language", () => {
    expect(isRegionOf("es", "BO")).toBe(true);
    expect(isRegionOf("pt", "BO")).toBe(false);
  });
});
