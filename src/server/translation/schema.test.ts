import { describe, expect, it } from "vitest";
import { translationOutputSchema } from "./schema";

const valid = {
  detectedLang: "es",
  correction: null,
  translations: { es: "hola", en: "hi", fr: "salut" },
  notes: null,
};

describe("translationOutputSchema", () => {
  it.each([
    "es",
    "en",
    "fr",
    "other",
  ])("accepts detectedLang %s", (detectedLang) => {
    expect(
      translationOutputSchema.parse({ ...valid, detectedLang }).detectedLang,
    ).toBe(detectedLang);
  });

  it("accepts a correction with an explanation", () => {
    const parsed = translationOutputSchema.parse({
      ...valid,
      correction: {
        text: "Llegué tarde al tren",
        explanation: "«Me tarde» no existe; se dice «llegué tarde».",
      },
    });
    expect(parsed.correction?.text).toBe("Llegué tarde al tren");
  });

  it("rejects output missing a translation", () => {
    expect(() =>
      translationOutputSchema.parse({
        ...valid,
        translations: { es: "hola", en: "hi" },
      }),
    ).toThrow();
  });

  it("rejects an unknown language", () => {
    expect(() =>
      translationOutputSchema.parse({ ...valid, detectedLang: "it" }),
    ).toThrow();
  });
});
