import type { Lang } from "../../shared/languages";

export interface PhraseDTO {
  lang: Lang;
  text: string;
  isRoot: boolean;
  correctedFrom: string | null;
}

export interface PhraseGroupDTO {
  id: string;
  createdAt: string;
  isFavorite: boolean;
  notes: string | null;
  correction: { text: string; explanation: string; accepted: boolean } | null;
  /** The root first, then the rest in catalog order. */
  phrases: PhraseDTO[];
}

export interface NewPhraseGroup {
  userId: string;
  notes: string | null;
  correction: { text: string; explanation: string } | null;
  phrases: { lang: Lang; text: string; isRoot: boolean }[];
}

export interface PhraseRepository {
  /** Inserts the group and its phrases in one transaction. */
  insertGroup(group: NewPhraseGroup): Promise<PhraseGroupDTO>;
  findById(userId: string, id: string): Promise<PhraseGroupDTO | null>;
  /** Returns the updated group, or null when the user has no group with that id. */
  setFavorite(
    userId: string,
    id: string,
    isFavorite: boolean,
  ): Promise<PhraseGroupDTO | null>;
  /** The user's starred groups, newest first. */
  listFavorites(userId: string): Promise<PhraseGroupDTO[]>;
}

/** Per-user caps: how many groups history keeps and how many can be starred. */
export interface PhraseLimits {
  historyLimit: number;
  phrasebookLimit: number;
}
