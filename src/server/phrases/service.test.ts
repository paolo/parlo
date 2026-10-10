import { describe, expect, it } from "vitest";
import type { TranslationResult } from "../translation/types";
import { buildNewGroup } from "./service";

const result: TranslationResult = {
  detectedLang: "es",
  correction: null,
  translations: {
    es: "Estoy harto de esperar",
    en: "I'm fed up with waiting",
    fr: "J'en ai marre d'attendre",
  },
  notes: "Expresión coloquial.",
};

describe("buildNewGroup", () => {
  it.each([
    "es",
    "en",
    "fr",
  ] as const)("makes the detected language (%s) the root", (detectedLang) => {
    const group = buildNewGroup("u1", "some phrase", {
      ...result,
      detectedLang,
    });
    const roots = group.phrases.filter((p) => p.isRoot);
    expect(roots).toEqual([
      { lang: detectedLang, text: "some phrase", isRoot: true },
    ]);
    expect(group.phrases.map((p) => p.lang).sort()).toEqual(["en", "es", "fr"]);
  });

  it("keeps the user's original input as the root text, even if the model reworded it", () => {
    const group = buildNewGroup(
      "u1",
      "Estoy hasta las narices de esperar",
      result,
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
    const group = buildNewGroup("u1", "me tarde", { ...result, correction });
    expect(group).toMatchObject({
      userId: "u1",
      correction,
      notes: "Expresión coloquial.",
    });
  });

  it("drops a 'correction' identical to the input", () => {
    const group = buildNewGroup("u1", "Hola", {
      ...result,
      correction: { text: "Hola", explanation: "Bien." },
    });
    expect(group.correction).toBeNull();
  });

  it("rejects results in an unsupported language", () => {
    expect(() =>
      buildNewGroup("u1", "ciao", { ...result, detectedLang: "other" }),
    ).toThrow();
  });
});
