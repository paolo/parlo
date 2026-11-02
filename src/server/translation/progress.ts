import { LANG_CODES, type Lang } from "../../shared/languages";
import type { TranslationProgress } from "./types";

const DETECTED = /"detectedLang"\s*:\s*"([a-z]+)"/;
// A finished entry of the translations array. Quotes inside a JSON string are escaped, so this cannot match
// text that merely looks like an entry inside another string.
const TRANSLATION =
  /\{\s*"lang"\s*:\s*"([a-z]+)"\s*,\s*"text"\s*:\s*("(?:[^"\\]|\\.)*")\s*\}/g;

/**
 * Reads what has arrived of the model's JSON answer so far (see translationOutputSchema, whose key order this
 * relies on). Anything cut off in the middle is left out, so a translation shows up only once its text is whole.
 */
export function readProgress(partialJson: string): TranslationProgress {
  const detected = DETECTED.exec(partialJson)?.[1];
  const translations: TranslationProgress["translations"] = [];
  for (const match of partialJson.matchAll(TRANSLATION)) {
    const lang = match[1] as Lang;
    if (!LANG_CODES.includes(lang)) continue;
    try {
      translations.push({ lang, text: JSON.parse(match[2]) as string });
    } catch {
      // Not valid JSON after all: wait for the final answer.
    }
  }
  return {
    detectedLang:
      detected &&
      (detected === "other" || LANG_CODES.includes(detected as Lang))
        ? (detected as Lang | "other")
        : undefined,
    translations,
  };
}
