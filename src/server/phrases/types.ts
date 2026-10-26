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
  /** "<bundleId>:<phraseId>" for a phrase saved from a bundle; null for the user's own translations. */
  bundleRef: string | null;
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

/** A bundle phrase to save for a user: the group is favorited and found again by its ref. */
export type NewBundleGroup = NewPhraseGroup & { bundleRef: string };

export interface PhrasePage {
  items: PhraseGroupDTO[];
  /** Pass back as `cursor` for the next page; null on the last page. */
  nextCursor: string | null;
}

export interface PhraseRepository {
  /** Inserts the group and its phrases in one transaction. */
  insertGroup(group: NewPhraseGroup): Promise<PhraseGroupDTO>;
  /**
   * Favorites the user's group for the bundle phrase, creating it from `group` when there is none. Never makes
   * a second group for the same ref. Throws PhrasebookFullError when it would be a new favorite past the cap.
   */
  favoriteBundleGroup(group: NewBundleGroup): Promise<PhraseGroupDTO>;
  /** Deletes the user's group for the ref. Returns false when there was none. */
  deleteBundleGroup(userId: string, bundleRef: string): Promise<boolean>;
  findById(userId: string, id: string): Promise<PhraseGroupDTO | null>;
  /**
   * Returns the updated group, or null when the user has no group with that id. Throws
   * PhrasebookFullError when starring would pass the user's cap.
   */
  setFavorite(
    userId: string,
    id: string,
    isFavorite: boolean,
  ): Promise<PhraseGroupDTO | null>;
  /**
   * Replaces the root phrase with the group's stored correction, keeping the typed text in
   * `correctedFrom`. Returns null when the user has no group with that id; throws
   * CorrectionNotAcceptableError when there is nothing to accept.
   */
  acceptCorrection(userId: string, id: string): Promise<PhraseGroupDTO | null>;
  /** Returns false when the user has no group with that id. */
  deleteGroup(userId: string, id: string): Promise<boolean>;
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

/** The user already has as many starred groups as the phrasebook holds. */
export class PhrasebookFullError extends Error {
  constructor(readonly limit: number) {
    super(`The phrasebook is full (${limit})`);
    this.name = "PhrasebookFullError";
  }
}

/** The group has no correction to accept, or its correction was already accepted. */
export class CorrectionNotAcceptableError extends Error {
  constructor(readonly code: "no_correction" | "already_accepted") {
    super(`The correction cannot be accepted (${code})`);
    this.name = "CorrectionNotAcceptableError";
  }
}
