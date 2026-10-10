import { LANGS } from "../db/schema";
import type { TranslationResult } from "../translation/types";
import type { NewPhraseGroup } from "./types";

/**
 * Maps a translation into a phrase group. The detected language is the root, and the root keeps the
 * user's own text: any rewording by the model only appears as a suggested correction.
 */
export function buildNewGroup(
  userId: string,
  text: string,
  result: TranslationResult,
): NewPhraseGroup {
  const root = result.detectedLang;
  if (root === "other") {
    throw new Error("Cannot build a phrase group for an unsupported language");
  }
  const correction =
    result.correction && result.correction.text.trim() !== text.trim()
      ? result.correction
      : null;
  return {
    userId,
    notes: result.notes,
    correction,
    phrases: LANGS.map((lang) => ({
      lang,
      text: lang === root ? text : result.translations[lang],
      isRoot: lang === root,
    })),
  };
}
