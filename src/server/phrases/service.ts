import { LANG_CODES, type Lang } from "../../shared/languages";
import type { ProfileLanguage } from "../profile/types";
import {
  TranslationFailedError,
  type TranslationResult,
} from "../translation/types";
import type { NewPhraseGroup, PhraseDTO, PhraseGroupDTO } from "./types";

/**
 * Maps a translation into a phrase group. The detected language is the root, and the root keeps the
 * user's own text: any rewording by the model only appears as a suggested correction. The group gets one
 * phrase per language of the user's profile. The model must translate into every other language exactly
 * once; its entry for the root language is optional because the root keeps the user's text anyway.
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
  const profileLangs = languages.map((l) => l.lang);
  const translated = new Map<Lang, string>();
  for (const t of result.translations) {
    if (translated.has(t.lang) || !profileLangs.includes(t.lang)) {
      throw new TranslationFailedError(
        "The translations do not match the user's languages",
      );
    }
    translated.set(t.lang, t.text);
  }
  if (profileLangs.some((lang) => lang !== root && !translated.has(lang))) {
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

/** The root first, then the rest in catalog order. */
export function orderPhraseDTOs(phrases: PhraseDTO[]): PhraseDTO[] {
  return [...phrases].sort(
    (a, b) =>
      Number(b.isRoot) - Number(a.isRoot) ||
      LANG_CODES.indexOf(a.lang) - LANG_CODES.indexOf(b.lang),
  );
}

/** What the stored group will look like, so a translation can be returned before it is written. */
export function describeNewGroup(
  group: NewPhraseGroup & { id: string; createdAt: Date },
): PhraseGroupDTO {
  return {
    id: group.id,
    createdAt: group.createdAt.toISOString(),
    isFavorite: false,
    bundleRef: null,
    notes: group.notes,
    correction: group.correction && { ...group.correction, accepted: false },
    phrases: orderPhraseDTOs(
      group.phrases.map((p) => ({ ...p, correctedFrom: null })),
    ),
  };
}
