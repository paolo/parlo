import type { PhraseDTO } from "@/server/phrases/types";
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
