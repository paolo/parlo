import type { PhraseDTO, PhraseGroupDTO } from "@/server/phrases/types";
import type { Lang } from "../shared/languages";
import type { TranslationProgress } from "./translateStream";

/**
 * The root first, then phrases in the viewer's profile order, then any other languages in the order
 * given (old groups can hold languages the viewer no longer has).
 */
export function orderPhrases(
  phrases: PhraseDTO[],
  profileLangs: Lang[],
): PhraseDTO[] {
  const rank = (p: PhraseDTO) => {
    if (p.isRoot) return -1;
    const index = profileLangs.indexOf(p.lang);
    return index === -1 ? profileLangs.length : index;
  };
  return [...phrases].sort((a, b) => rank(a) - rank(b));
}

/** The phrase in `lang`, or the root (marked as a fallback) for groups that never had that language. */
export function pickPhrase(
  group: PhraseGroupDTO,
  lang: Lang,
): { phrase: PhraseDTO; fallback: boolean } {
  const match = group.phrases.find((p) => p.lang === lang);
  if (match) return { phrase: match, fallback: false };
  const root = group.phrases.find((p) => p.isRoot) ?? group.phrases[0];
  return { phrase: root, fallback: true };
}

/**
 * A translation that is still arriving, shaped like a stored group so the same cards can show it: the
 * viewer's own text as the original and the translations so far. Null until there is something to show.
 * It has no id, so it can't be favorited; the stored group replaces it when the answer is complete.
 */
export function partialGroup(
  text: string,
  progress: TranslationProgress,
): PhraseGroupDTO | null {
  const { detected, translations } = progress;
  if (!detected || translations.length === 0) return null;
  return {
    id: "",
    createdAt: new Date(0).toISOString(),
    isFavorite: false,
    bundleRef: null,
    notes: null,
    correction: null,
    phrases: [
      { lang: detected, text, isRoot: true, correctedFrom: null },
      ...translations
        .filter((t) => t.lang !== detected)
        .map((t) => ({ ...t, isRoot: false, correctedFrom: null })),
    ],
  };
}

/**
 * The group as it looks with its correction applied (the root holds the corrected text and keeps the typed one in
 * `correctedFrom`) or not (the root holds the typed text). The group itself when it has no correction or is
 * already that way.
 */
export function withCorrection(
  group: PhraseGroupDTO,
  applied: boolean,
): PhraseGroupDTO {
  const { correction } = group;
  if (!correction || correction.accepted === applied) return group;
  return {
    ...group,
    correction: { ...correction, accepted: applied },
    phrases: group.phrases.map((p) => {
      if (!p.isRoot) return p;
      return applied
        ? { ...p, text: correction.text, correctedFrom: p.text }
        : { ...p, text: p.correctedFrom ?? p.text, correctedFrom: null };
    }),
  };
}
