import { LANG_CODES, type Lang } from "../../shared/languages";
import type { ProfileLanguage } from "../profile/types";
import {
  TranslationFailedError,
  type TranslationResult,
} from "../translation/types";
import type { NewPhraseGroup, PhraseDTO, PhraseGroupDTO } from "./types";

/**
 * Maps a translation into a phrase group. The detected language is the root. A correction is applied at once: the
 * root holds the corrected text and keeps what the user typed in `correctedFrom`, so it can be reverted. Any other
 * rewording by the model (its entry for the root language) is ignored. The group gets one
 * phrase per language of the user's profile. The model must translate into every other language exactly
 * once; its entry for the root language is optional because the root never uses it.
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
    correction: correction && { ...correction, applied: true },
    phrases: languages.map(({ lang }) => {
      if (lang !== root) {
        return {
          lang,
          text: translated.get(lang) as string,
          isRoot: false,
          correctedFrom: null,
        };
      }
      return correction
        ? { lang, text: correction.text, isRoot: true, correctedFrom: text }
        : { lang, text, isRoot: true, correctedFrom: null };
    }),
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
    correction: group.correction && {
      text: group.correction.text,
      explanation: group.correction.explanation,
      accepted: group.correction.applied ?? false,
    },
    phrases: orderPhraseDTOs(
      group.phrases.map((p) => ({
        ...p,
        correctedFrom: p.correctedFrom ?? null,
      })),
    ),
  };
}
