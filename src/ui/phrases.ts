import type { PhraseDTO, PhraseGroupDTO } from "@/server/phrases/types";
import type { Lang } from "../shared/languages";

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
