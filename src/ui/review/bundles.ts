import type { PhraseGroupDTO } from "@/server/phrases/types";
import type { Bundle } from "../../shared/bundles";
import type { Lang } from "../../shared/languages";

/**
 * A bundle's phrases in the shape Practice already deals, so cards need no new concepts. Bundles carry every
 * language, but a card only gets the viewer's own, in the order given.
 */
export function bundleToGroups(
  bundle: Bundle,
  langs: Lang[],
): PhraseGroupDTO[] {
  return bundle.phrases.map((phrase) => ({
    id: `bundle:${phrase.id}`,
    createdAt: "2026-10-26T00:00:00.000Z",
    isFavorite: false,
    bundleRef: `${bundle.id}:${phrase.id}`,
    notes: null,
    correction: null,
    phrases: langs.map((lang) => ({
      lang,
      text: phrase.text[lang],
      isRoot: false,
      correctedFrom: null,
    })),
  }));
}
