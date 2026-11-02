import { describe, expect, it } from "vitest";
import { readProgress } from "./progress";

const full =
  '{"detectedLang":"en","translations":[{"lang":"es","text":"Llegué tarde"},{"lang":"en","text":"I was late"},{"lang":"fr","text":"J\'étais en retard"}],"correction":null,"notes":null}';

describe("readProgress", () => {
  it("knows nothing from an empty or barely started answer", () => {
    expect(readProgress("")).toEqual({ translations: [] });
    expect(readProgress('{"detec')).toEqual({ translations: [] });
    expect(readProgress('{"detectedLang":"e')).toEqual({ translations: [] });
  });

  it("reads the detected language as soon as it is complete", () => {
    expect(readProgress('{"detectedLang":"en","transl')).toEqual({
      detectedLang: "en",
      translations: [],
    });
  });

  it("lists a translation only once its text is whole", () => {
    const cut = full.indexOf('{"lang":"en"') + 30;
    expect(readProgress(full.slice(0, cut))).toEqual({
      detectedLang: "en",
      translations: [{ lang: "es", text: "Llegué tarde" }],
    });
  });

  it("reads every translation from the finished answer", () => {
    expect(readProgress(full).translations).toEqual([
      { lang: "es", text: "Llegué tarde" },
      { lang: "en", text: "I was late" },
      { lang: "fr", text: "J'étais en retard" },
    ]);
  });

  it("decodes escapes and keeps quotes and braces inside the text", () => {
    const json =
      '{"detectedLang":"es","translations":[{"lang":"en","text":"He said \\"hi\\" {\\"lang\\":\\"fr\\"}\\nbye"}],"correction":null,"notes":null}';
    expect(readProgress(json).translations).toEqual([
      { lang: "en", text: 'He said "hi" {"lang":"fr"}\nbye' },
    ]);
  });

  it("accepts 'other' and ignores languages the app does not know", () => {
    expect(readProgress('{"detectedLang":"other"').detectedLang).toBe("other");
    expect(readProgress('{"detectedLang":"zz"').detectedLang).toBeUndefined();
    expect(
      readProgress('{"translations":[{"lang":"zz","text":"x"}').translations,
    ).toEqual([]);
  });
});
