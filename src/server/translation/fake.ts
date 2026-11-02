import type {
  TranslateInput,
  TranslateOptions,
  TranslationResult,
  Translator,
} from "./types";

/** Test double: returns a fixed result (or computes one) and records every input. Reports it as progress too. */
export class FakeTranslator implements Translator {
  readonly calls: TranslateInput[] = [];

  constructor(
    private readonly result:
      | TranslationResult
      | Error
      | ((input: TranslateInput) => TranslationResult),
  ) {}

  async translate(
    input: TranslateInput,
    options?: TranslateOptions,
  ): Promise<TranslationResult> {
    this.calls.push(input);
    if (this.result instanceof Error) throw this.result;
    const result =
      typeof this.result === "function" ? this.result(input) : this.result;
    for (let n = 0; n <= result.translations.length; n++) {
      options?.onProgress?.({
        detectedLang: result.detectedLang,
        translations: result.translations.slice(0, n),
      });
    }
    return result;
  }
}
