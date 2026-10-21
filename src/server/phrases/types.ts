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

export interface PhrasePage {
  items: PhraseGroupDTO[];
  /** Pass back as `cursor` for the next page; null on the last page. */
  nextCursor: string | null;
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
  /** One page of the user's groups, newest first; `favorite` keeps only the starred ones. */
  listGroups(
    userId: string,
    options: { favorite?: boolean; limit: number; cursor?: string },
  ): Promise<PhrasePage>;
}

/** Per-user caps: how many groups history keeps and how many can be starred. */
export interface PhraseLimits {
  historyLimit: number;
  phrasebookLimit: number;
}
