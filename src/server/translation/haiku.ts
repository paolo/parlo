import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { readProgress } from "./progress";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt";
import { translationOutputSchema } from "./schema";
import {
  type TranslateInput,
  type TranslateOptions,
  TranslationFailedError,
  type TranslationResult,
  type Translator,
} from "./types";

export const TRANSLATION_MODEL = "claude-haiku-5-5";

export type Effort = "low" | "medium" | "high";

export class HaikuTranslator implements Translator {
  constructor(
    private readonly client: Anthropic,
    private readonly effort: Effort = "low",
  ) {}

  async translate(
    input: TranslateInput,
    options: TranslateOptions = {},
  ): Promise<TranslationResult> {
    let message: Awaited<ReturnType<typeof this.request>>;
    try {
      message = await this.request(input, options);
    } catch (error) {
      // The SDK already retried 408/409/429/5xx and connection errors twice.
      throw new TranslationFailedError("Translation request failed", {
        cause: error,
      });
    }
    if (message.stop_reason === "refusal") {
      throw new TranslationFailedError(
        "The model declined to translate this phrase",
      );
    }
    if (!message.parsed_output) {
      throw new TranslationFailedError(
        `No parseable output (stop_reason: ${message.stop_reason})`,
      );
    }
    return {
      ...message.parsed_output,
      usage: message.usage && {
        model: TRANSLATION_MODEL,
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  }

  /** Streams the answer, so `onProgress` can hand over each translation as soon as it is written. */
  private request(
    input: TranslateInput,
    { onProgress, signal }: TranslateOptions,
  ) {
    const stream = this.client.messages.stream(
      {
        model: TRANSLATION_MODEL,
        // Thinking tokens count toward max_tokens; leave room for them plus the JSON.
        max_tokens: 2048,
        // Effort steers adaptive thinking. Default low: translation is latency-sensitive, and the model
        // can skip thinking on easy phrases.
        output_config: {
          effort: this.effort,
          format: zodOutputFormat(translationOutputSchema),
        },
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserMessage(input) }],
      },
      { signal },
    );
    if (onProgress) {
      let seen = "";
      stream.on("text", (_delta, snapshot) => {
        const progress = readProgress(snapshot);
        const key = `${progress.detectedLang}:${progress.translations.length}`;
        if (key === seen) return;
        seen = key;
        onProgress(progress);
      });
    }
    return stream.finalMessage();
  }
}
