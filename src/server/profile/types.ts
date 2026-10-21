import type { Lang } from "../../shared/languages";
import type { Level } from "../db/schema";

export interface ProfileLanguage {
  lang: Lang;
  /** ISO 3166-1 alpha-2, always set: the language default fills a missing one. */
  region: string;
  level: Level;
  /** 0 = native language, 1 and 2 = learning languages. */
  position: number;
}

export interface ProfileInput {
  lang: Lang;
  region?: string;
}

export interface ProfileRepository {
  /** The user's languages ordered by position; empty when they have not picked any. */
  getProfile(userId: string): Promise<ProfileLanguage[]>;
  /** Replaces the user's whole set in one transaction. */
  replaceProfile(userId: string, languages: ProfileLanguage[]): Promise<void>;
}
