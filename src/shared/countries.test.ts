import { describe, expect, it } from "vitest";
import { countriesFor, languagesIn } from "./countries";
import { LANG_CODES, type Lang, regionName } from "./languages";

const natives: Lang[] = LANG_CODES.filter((l) => l !== "en" && l !== "fr");

describe("countriesFor", () => {
  it("lists each country once, alphabetically by name", () => {
    const names = countriesFor(natives).map(regionName);

    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("includes only countries where one of the languages is spoken", () => {
    const countries = countriesFor(natives);

    expect(countries).toContain("BO");
    expect(countries).toContain("BR");
    expect(countries).toContain("UA");
    // English and French are not on offer, so countries that only have them are left out.
    expect(countries).not.toContain("NG");
    expect(countries).not.toContain("HT");
    expect(countries).not.toContain("SN");
  });

  it("includes English-speaking countries when English is on offer", () => {
    expect(countriesFor(LANG_CODES)).toContain("NG");
  });
});

describe("languagesIn", () => {
  it("gives the single language of most countries", () => {
    expect(languagesIn("BO", natives)).toEqual(["es"]);
    expect(languagesIn("BR", natives)).toEqual(["pt"]);
  });

  it("gives several for countries that have several", () => {
    expect(languagesIn("UA", natives)).toEqual(["uk", "ru"]);
    expect(languagesIn("IN", natives)).toEqual(["pa", "hi"]);
  });

  it("only counts the languages on offer", () => {
    expect(languagesIn("CA", natives)).toEqual([]);
    expect(languagesIn("CA", LANG_CODES)).toEqual(["en", "fr"]);
  });
});
