import { describe, expect, it } from "vitest";
import type { PhraseDTO } from "@/server/phrases/types";
import { orderPhrases } from "./phrases";

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
