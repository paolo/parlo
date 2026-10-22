import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@/shared/languages";
import { conversationAt, NATIVE_CYCLE, PHRASE_SETS } from "./phrases";

const CODES = ["en", "fr", ...NATIVE_CYCLE] as const;

describe("PHRASE_SETS", () => {
  it("only uses languages the app supports", () => {
    for (const code of CODES) expect(LANGUAGES).toHaveProperty(code);
  });

  it.each(
    PHRASE_SETS.map((set) => [set.id, set] as const),
  )("%s has a non-empty phrase in all eight languages", (_id, set) => {
    expect(set.meaning.trim()).not.toBe("");
    expect(Object.keys(set.phrases).sort()).toEqual([...CODES].sort());
    for (const code of CODES) {
      expect(set.phrases[code].trim()).not.toBe("");
    }
  });

  it("keeps every phrase within 40 characters so bubbles do not change height", () => {
    for (const set of PHRASE_SETS) {
      for (const [code, text] of Object.entries(set.phrases)) {
        expect(
          [...text].length,
          `${set.id} ${code}: ${text}`,
        ).toBeLessThanOrEqual(40);
      }
    }
  });

  it("has eight sets, a mix of Canadian and general ones", () => {
    expect(PHRASE_SETS).toHaveLength(8);
    const canadian = PHRASE_SETS.filter((set) => set.canadian).length;
    expect(canadian).toBeGreaterThanOrEqual(3);
    expect(PHRASE_SETS.length - canadian).toBeGreaterThanOrEqual(3);
  });

  it("tags every set with the Spanish-speaking country its Spanish phrase belongs to", () => {
    for (const set of PHRASE_SETS) {
      expect(LANGUAGES.es.regions).toContain(set.esRegion);
    }
    const regions = new Set(PHRASE_SETS.map((set) => set.esRegion));
    expect(regions).toEqual(new Set(["ES", "BO"]));
  });

  it("has unique ids", () => {
    const ids = PHRASE_SETS.map((set) => set.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("starts with the very cold set from the design", () => {
    expect(PHRASE_SETS[0]?.phrases).toMatchObject({
      fr: "Il fait frette",
      en: "It's freezing out",
      es: "Hace un frío que pela",
      uk: "Дубак надворі",
    });
  });
});

describe("NATIVE_CYCLE", () => {
  it("lists the six rotating native languages in order", () => {
    expect(NATIVE_CYCLE).toEqual(["es", "pt", "uk", "zh", "hi", "pa"]);
  });
});

describe("conversationAt", () => {
  it("starts with the first set in Spanish, from Spain", () => {
    const { set, native, region } = conversationAt(0);
    expect(set).toBe(PHRASE_SETS[0]);
    expect(native).toBe("es");
    expect(region).toBe("ES");
  });

  it("takes the Spanish flag from the phrase set", () => {
    const { set, region } = conversationAt(6);
    expect(conversationAt(6).native).toBe("es");
    expect(region).toBe(set.esRegion);
  });

  it("shows Portuguese with Brazil's flag and other languages with their usual one", () => {
    expect(conversationAt(1)).toMatchObject({ native: "pt", region: "BR" });
    expect(conversationAt(2)).toMatchObject({ native: "uk", region: "UA" });
    expect(conversationAt(3)).toMatchObject({ native: "zh", region: "CN" });
    expect(conversationAt(4)).toMatchObject({ native: "hi", region: "IN" });
    expect(conversationAt(5)).toMatchObject({ native: "pa", region: "IN" });
  });

  it("pairs every phrase set with every native language before repeating", () => {
    const period = PHRASE_SETS.length * NATIVE_CYCLE.length;
    const pairs = new Set<string>();
    for (let step = 0; step < period; step++) {
      const { set, native } = conversationAt(step);
      pairs.add(`${set.id}|${native}`);
    }
    expect(pairs.size).toBe(period);
    expect(conversationAt(period).set).toBe(conversationAt(0).set);
    expect(conversationAt(period).native).toBe(conversationAt(0).native);
  });

  it("changes the native language on every step", () => {
    for (let step = 0; step < 100; step++) {
      expect(conversationAt(step).native).not.toBe(
        conversationAt(step + 1).native,
      );
    }
  });
});
