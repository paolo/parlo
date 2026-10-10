import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt";
import { translationOutputSchema } from "./schema";
import {
  type TranslateInput,
  TranslationFailedError,
  type TranslationResult,
  type Translator,
} from "./types";

export const TRANSLATION_MODEL = "claude-haiku-5-5";

export class HaikuTranslator implements Translator {
  constructor(private readonly client: Anthropic) {}

  async translate(input: TranslateInput): Promise<TranslationResult> {
    let message: Awaited<ReturnType<typeof this.request>>;
    try {
      message = await this.request(input);
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
    return message.parsed_output;
  }

  private request(input: TranslateInput) {
    return this.client.messages.parse({
      model: TRANSLATION_MODEL,
      // Thinking tokens count toward max_tokens; leave room for them plus the JSON.
      max_tokens: 2048,
      // Low effort: translation is latency-sensitive, and the model can skip thinking on easy phrases.
      output_config: {
        effort: "low",
        format: zodOutputFormat(translationOutputSchema),
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(input) }],
    });
  }
}
