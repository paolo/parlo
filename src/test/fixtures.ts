import type { PhraseGroupDTO } from "@/server/phrases/types";

export function makeGroup(
  overrides: Partial<PhraseGroupDTO> = {},
): PhraseGroupDTO {
  return {
    id: "g1",
    createdAt: "2026-10-20T10:00:00.000Z",
    isFavorite: false,
    notes: null,
    correction: null,
    phrases: {
      es: {
        lang: "es",
        text: "Llueve a cántaros",
        isRoot: true,
        correctedFrom: null,
      },
      en: {
        lang: "en",
        text: "It's pouring",
        isRoot: false,
        correctedFrom: null,
      },
      fr: {
        lang: "fr",
        text: "Il pleut des cordes",
        isRoot: false,
        correctedFrom: null,
      },
    },
    ...overrides,
  };
}
