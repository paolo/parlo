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
  it("starts with the first set in Spanish", () => {
    const { set, native } = conversationAt(0);
    expect(set).toBe(PHRASE_SETS[0]);
    expect(native).toBe("es");
  });

  it("wraps the native cycle after six steps", () => {
    expect(conversationAt(6).native).toBe("es");
  });

  it("wraps the phrase sets independently", () => {
    expect(conversationAt(PHRASE_SETS.length).set).toBe(PHRASE_SETS[0]);
  });
});
