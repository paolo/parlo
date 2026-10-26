import { describe, expect, it } from "vitest";
import { LANG_CODES } from "../languages";
import { starter } from "./starter";

const phrases = starter.phrases;

describe("the Starter bundle", () => {
  it("has about a hundred phrases", () => {
    expect(phrases.length).toBeGreaterThanOrEqual(95);
    expect(phrases.length).toBeLessThanOrEqual(105);
  });

  it("has unique ids shaped starter-NNN", () => {
    const ids = phrases.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^starter-\d{3}$/);
  });

  it("has every phrase in all 13 languages, non-empty and trimmed", () => {
    for (const phrase of phrases) {
      expect(Object.keys(phrase.text).sort()).toEqual([...LANG_CODES].sort());
      for (const lang of LANG_CODES) {
        const text = phrase.text[lang];
        expect(text, `${phrase.id} ${lang}`).not.toBe("");
        expect(text, `${phrase.id} ${lang}`).toBe(text.trim());
      }
    }
  });

  it("is about 80% English and 20% Québécois French sources", () => {
    const english = phrases.filter((p) => p.source === "en").length;
    expect(english).toBeGreaterThanOrEqual(75);
    expect(english).toBeLessThanOrEqual(85);
    expect(phrases.length - english).toBe(
      phrases.filter((p) => p.source === "fr").length,
    );
  });

  it("has no duplicate source text", () => {
    const texts = phrases.map((p) => p.text[p.source]);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("covers the everyday topics", () => {
    const topics = new Set(phrases.map((p) => p.topic));
    for (const topic of [
      "greetings",
      "transit",
      "shops",
      "restaurants",
      "health",
      "work-school",
      "housing",
      "phone-banking",
      "small-talk",
      "emergencies",
    ]) {
      expect(topics, topic).toContain(topic);
    }
  });

  it("writes each language in its own script", () => {
    const scripts = {
      ar: /[؀-ۿ]/,
      fa: /[؀-ۿ]/,
      pa: /[਀-੿]/,
      hi: /[ऀ-ॿ]/,
      uk: /[Ѐ-ӿ]/,
      ru: /[Ѐ-ӿ]/,
      zh: /[一-鿿]/,
    } as const;
    for (const phrase of phrases) {
      for (const [lang, script] of Object.entries(scripts)) {
        expect(
          phrase.text[lang as keyof typeof scripts],
          `${phrase.id} ${lang}`,
        ).toMatch(script);
      }
    }
  });
});
