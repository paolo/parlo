import type { Lang, Level } from "../db/schema";

export type Levels = Record<Lang, Level>;

export interface TranslateInput {
  text: string;
  levels: Levels;
}

export interface TranslationResult {
  detectedLang: Lang | "other";
  correction: { text: string; explanation: string } | null;
  translations: Record<Lang, string>;
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
