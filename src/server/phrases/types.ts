import type { Lang } from "../db/schema";

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
  phrases: Record<Lang, PhraseDTO>;
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
