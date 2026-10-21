import { describe, expect, it } from "vitest";
import { buildProfile } from "../profile/service";
import {
  TranslationFailedError,
  type TranslationResult,
} from "../translation/types";
import { buildNewGroup } from "./service";

const esEnFr = buildProfile([{ lang: "es" }, { lang: "en" }, { lang: "fr" }]);

const result: TranslationResult = {
  detectedLang: "es",
  correction: null,
  translations: [
    { lang: "es", text: "Estoy harto de esperar" },
    { lang: "en", text: "I'm fed up with waiting" },
    { lang: "fr", text: "J'en ai marre d'attendre" },
  ],
  notes: "Expresión coloquial.",
};

describe("buildNewGroup", () => {
  it.each([
    "es",
    "en",
    "fr",
  ] as const)("makes the detected language (%s) the root", (detectedLang) => {
    const group = buildNewGroup(
      "u1",
      "some phrase",
      { ...result, detectedLang },
      esEnFr,
    );
    const roots = group.phrases.filter((p) => p.isRoot);
    expect(roots).toEqual([
      { lang: detectedLang, text: "some phrase", isRoot: true },
    ]);
    expect(group.phrases.map((p) => p.lang).sort()).toEqual(["en", "es", "fr"]);
  });

  it("creates one phrase per language of a pt/en/fr profile", () => {
    const ptEnFr = buildProfile([
      { lang: "pt" },
      { lang: "en" },
      { lang: "fr" },
    ]);
    const group = buildNewGroup(
      "u1",
      "Tô com saudade",
      {
        ...result,
        detectedLang: "pt",
        translations: [
          { lang: "fr", text: "Tu me manques" },
          { lang: "pt", text: "Tô com saudade" },
          { lang: "en", text: "I miss you" },
        ],
      },
      ptEnFr,
    );
    expect(group.phrases.map((p) => p.lang)).toEqual(["pt", "en", "fr"]);
    expect(group.phrases.find((p) => p.lang === "en")?.text).toBe("I miss you");
  });

  it("does not need the model to repeat the phrase's own language", () => {
    const group = buildNewGroup(
      "u1",
      "hola",
      { ...result, translations: result.translations.slice(1) },
      esEnFr,
    );
    expect(group.phrases).toEqual([
      { lang: "es", text: "hola", isRoot: true },
      { lang: "en", text: "I'm fed up with waiting", isRoot: false },
      { lang: "fr", text: "J'en ai marre d'attendre", isRoot: false },
    ]);
  });

  it("keeps the user's original input as the root text, even if the model reworded it", () => {
    const group = buildNewGroup(
      "u1",
      "Estoy hasta las narices de esperar",
      result,
      esEnFr,
    );
    expect(group.phrases.find((p) => p.isRoot)?.text).toBe(
      "Estoy hasta las narices de esperar",
    );
    expect(group.phrases.find((p) => p.lang === "en")?.text).toBe(
      "I'm fed up with waiting",
    );
  });

  it("stores the correction and notes on the group", () => {
    const correction = {
      text: "Llegué tarde",
      explanation: "«Me tarde» no existe.",
    };
    const group = buildNewGroup(
      "u1",
      "me tarde",
      { ...result, correction },
      esEnFr,
    );
    expect(group).toMatchObject({
      userId: "u1",
      correction,
      notes: "Expresión coloquial.",
    });
  });

  it("drops a 'correction' identical to the input", () => {
    const group = buildNewGroup(
      "u1",
      "Hola",
      { ...result, correction: { text: "Hola", explanation: "Bien." } },
      esEnFr,
    );
    expect(group.correction).toBeNull();
  });

  it("rejects results in an unsupported language", () => {
    expect(() =>
      buildNewGroup("u1", "ciao", { ...result, detectedLang: "other" }, esEnFr),
    ).toThrow();
  });

  it.each([
    ["misses a language", result.translations.slice(0, 2)],
    [
      "repeats a language",
      [
        ...result.translations.slice(0, 2),
        { lang: "en" as const, text: "again" },
      ],
    ],
    [
      "adds a language outside the profile",
      [
        ...result.translations.slice(0, 2),
        { lang: "it" as const, text: "ciao" },
      ],
    ],
    [
      "has four entries",
      [...result.translations, { lang: "it" as const, text: "ciao" }],
    ],
  ])("fails when the translations %s", (_name, translations) => {
    expect(() =>
      buildNewGroup("u1", "hola", { ...result, translations }, esEnFr),
    ).toThrow(TranslationFailedError);
  });
});
