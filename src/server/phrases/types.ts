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
}
