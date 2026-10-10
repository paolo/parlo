import type { TranslateInput, TranslationResult, Translator } from "./types";

/** Test double: returns a fixed result (or computes one) and records every input. */
export class FakeTranslator implements Translator {
  readonly calls: TranslateInput[] = [];

  constructor(
    private readonly result:
      | TranslationResult
      | Error
      | ((input: TranslateInput) => TranslationResult),
  ) {}

  async translate(input: TranslateInput): Promise<TranslationResult> {
    this.calls.push(input);
    if (this.result instanceof Error) throw this.result;
    return typeof this.result === "function" ? this.result(input) : this.result;
  }
}
