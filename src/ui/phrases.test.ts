import { describe, expect, it } from "vitest";
import type { PhraseDTO } from "@/server/phrases/types";
import { makeGroup } from "@/test/fixtures";
import { orderPhrases, partialGroup, pickPhrase } from "./phrases";

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

describe("partialGroup", () => {
  it("has nothing to show before the language and a translation have arrived", () => {
    expect(partialGroup("hi", { translations: [] })).toBeNull();
    expect(partialGroup("hi", { detected: "en", translations: [] })).toBeNull();
    expect(
      partialGroup("hi", { translations: [{ lang: "es", text: "hola" }] }),
    ).toBeNull();
  });

  it("keeps the viewer's own text as the original and adds the translations so far", () => {
    const group = partialGroup("me late", {
      detected: "en",
      translations: [
        { lang: "es", text: "Llego tarde" },
        { lang: "en", text: "I'm late" },
      ],
    });

    expect(group?.phrases).toEqual([
      { lang: "en", text: "me late", isRoot: true, correctedFrom: null },
      { lang: "es", text: "Llego tarde", isRoot: false, correctedFrom: null },
    ]);
    expect(group?.id).toBe("");
  });
});
