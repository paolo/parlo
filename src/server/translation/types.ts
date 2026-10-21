import type { Lang } from "../../shared/languages";
import type { ProfileLanguage } from "../profile/types";

export interface TranslateInput {
  text: string;
  /** The user's languages in profile order: the native one first. */
  languages: ProfileLanguage[];
}

export interface TranslationResult {
  detectedLang: Lang | "other";
  correction: { text: string; explanation: string } | null;
  /** One entry for each of the user's languages. */
  translations: { lang: Lang; text: string }[];
  notes: string | null;
}

export interface Translator {
  translate(input: TranslateInput): Promise<TranslationResult>;
}

/** The model could not produce a usable translation (API error, refusal, or unparseable output). */
export class TranslationFailedError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "TranslationFailedError";
  }
}
