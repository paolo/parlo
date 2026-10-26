import type { PhraseGroupDTO } from "@/server/phrases/types";
import type { Bundle } from "../../shared/bundles";
import { LANG_CODES } from "../../shared/languages";

/** A bundle's phrases in the shape Practice already deals, so cards need no new concepts. */
export function bundleToGroups(bundle: Bundle): PhraseGroupDTO[] {
  return bundle.phrases.map((phrase) => ({
    id: `bundle:${phrase.id}`,
    createdAt: "2026-10-26T00:00:00.000Z",
    isFavorite: false,
    notes: null,
    correction: null,
    phrases: LANG_CODES.map((lang) => ({
      lang,
      text: phrase.text[lang],
      isRoot: false,
      correctedFrom: null,
    })),
  }));
}
