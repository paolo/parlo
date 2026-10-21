import { describe, expect, it } from "vitest";
import type { PhraseDTO } from "@/server/phrases/types";
import { makeGroup } from "@/test/fixtures";
import { orderPhrases, pickPhrase } from "./phrases";

const phrase = (lang: PhraseDTO["lang"], isRoot = false): PhraseDTO => ({
  lang,
  text: lang,
  isRoot,
  correctedFrom: null,
});
const langs = (phrases: PhraseDTO[]) => phrases.map((p) => p.lang);

describe("orderPhrases", () => {
  it("puts the root first, then the profile languages in profile order", () => {
    const ordered = orderPhrases(
      [phrase("es"), phrase("fr", true), phrase("en")],
      ["en", "fr", "pt"],
    );

    expect(langs(ordered)).toEqual(["fr", "en", "es"]);
  });

  it("keeps languages outside the profile, after the profile ones", () => {
    const ordered = orderPhrases(
      [phrase("es", true), phrase("it"), phrase("en")],
      ["en", "fr", "pt"],
    );

    expect(langs(ordered)).toEqual(["es", "en", "it"]);
  });

  it("keeps the given order when there is no profile", () => {
    const ordered = orderPhrases(
      [phrase("fr"), phrase("es"), phrase("en")],
      [],
    );

    expect(langs(ordered)).toEqual(["fr", "es", "en"]);
  });
});

describe("pickPhrase", () => {
  it("returns the phrase in the requested language", () => {
    const { phrase, fallback } = pickPhrase(makeGroup(), "fr");

    expect(phrase.text).toBe("Il pleut des cordes");
    expect(fallback).toBe(false);
  });

  it("falls back to the root when the group lacks the language", () => {
    const { phrase, fallback } = pickPhrase(makeGroup(), "pt");

    expect(phrase.text).toBe("Llueve a cántaros");
    expect(phrase.isRoot).toBe(true);
    expect(fallback).toBe(true);
  });
});
