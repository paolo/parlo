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
  /** Set when the group was handed out before it is stored, so the row ends up with the same id and time. */
  id?: string;
  createdAt?: Date;
  userId: string;
  notes: string | null;
  /** `applied`: the root phrase already holds the corrected text (its typed text is in `correctedFrom`). */
  correction: { text: string; explanation: string; applied?: boolean } | null;
  phrases: {
    lang: Lang;
    text: string;
    isRoot: boolean;
    /** What the user typed, when the root holds an applied correction instead. */
    correctedFrom?: string | null;
  }[];
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
   * Puts the group's stored correction in the root phrase (keeping the typed text in `correctedFrom`), or puts the
   * typed text back. Setting the state the group already has returns it unchanged. Returns null when the user has
   * no group with that id; throws CorrectionNotAcceptableError when the group has no correction.
   */
  setCorrectionApplied(
    userId: string,
    id: string,
    applied: boolean,
  ): Promise<PhraseGroupDTO | null>;
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

/** The group has no correction to apply or revert. */
export class CorrectionNotAcceptableError extends Error {
  constructor(readonly code: "no_correction") {
    super(`The correction cannot be changed (${code})`);
    this.name = "CorrectionNotAcceptableError";
  }
}
