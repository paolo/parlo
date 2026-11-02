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
  /** What the model provider billed for this call; absent when the translator cannot tell (tests). */
  usage?: { model: string; inputTokens: number; outputTokens: number };
}

/** What has arrived of an answer that is still being written. Only grows: later calls repeat earlier entries. */
export interface TranslationProgress {
  detectedLang?: Lang | "other";
  /** The translations whose text is complete, in the order the model wrote them. */
  translations: { lang: Lang; text: string }[];
}

export interface TranslateOptions {
  /** Called each time more of the answer has arrived, before `translate` resolves. */
  onProgress?: (progress: TranslationProgress) => void;
  /** Stops the model call, e.g. when the answer is not wanted any more. */
  signal?: AbortSignal;
}

export interface Translator {
  translate(
    input: TranslateInput,
    options?: TranslateOptions,
  ): Promise<TranslationResult>;
}

/** The model could not produce a usable translation (API error, refusal, or unparseable output). */
export class TranslationFailedError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "TranslationFailedError";
  }
}
