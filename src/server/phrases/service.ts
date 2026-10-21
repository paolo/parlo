import type { ProfileLanguage } from "../profile/types";
import {
  TranslationFailedError,
  type TranslationResult,
} from "../translation/types";
import type { NewPhraseGroup } from "./types";

/**
 * Maps a translation into a phrase group. The detected language is the root, and the root keeps the
 * user's own text: any rewording by the model only appears as a suggested correction. The group gets one
 * phrase per language of the user's profile, and the model's translations must cover exactly those.
 */
export function buildNewGroup(
  userId: string,
  text: string,
  result: TranslationResult,
  languages: ProfileLanguage[],
): NewPhraseGroup {
  const root = result.detectedLang;
  if (root === "other") {
    throw new Error("Cannot build a phrase group for an unsupported language");
  }
  const translated = new Map(result.translations.map((t) => [t.lang, t.text]));
  if (
    result.translations.length !== languages.length ||
    languages.some(({ lang }) => !translated.has(lang))
  ) {
    throw new TranslationFailedError(
      "The translations do not cover the user's languages",
    );
  }
  const correction =
    result.correction && result.correction.text.trim() !== text.trim()
      ? result.correction
      : null;
  return {
    userId,
    notes: result.notes,
    correction,
    phrases: languages.map(({ lang }) => ({
      lang,
      text: lang === root ? text : (translated.get(lang) as string),
      isRoot: lang === root,
    })),
  };
}
