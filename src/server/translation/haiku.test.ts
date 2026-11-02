import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { buildProfile } from "../profile/service";
import { HaikuTranslator, TRANSLATION_MODEL } from "./haiku";
import { TranslationFailedError } from "./types";

const languages = buildProfile([
  { lang: "es", region: "BO" },
  { lang: "en" },
  { lang: "fr" },
]);
const output = {
  detectedLang: "en",
  correction: {
    text: "I was late for the train",
    explanation: "«Me late» no es inglés.",
  },
  translations: [
    { lang: "es", text: "Llegué tarde al tren" },
    { lang: "en", text: "I was late for the train" },
    { lang: "fr", text: "J'étais en retard pour le train" },
  ],
  notes: null,
};

/** A client whose stream emits `snapshots` (the answer so far, growing) as text events, then resolves to `result`. */
function clientReturning(result: unknown, snapshots: string[] = []) {
  const parse = vi.fn((_params: unknown, _options?: unknown) => {
    const handlers: ((delta: string, snapshot: string) => void)[] = [];
    const stream = {
      on(_event: "text", handler: (delta: string, snapshot: string) => void) {
        handlers.push(handler);
        return stream;
      },
      async finalMessage() {
        for (const snapshot of snapshots) {
          for (const handler of handlers) handler("", snapshot);
        }
        return result;
      },
    };
    return stream;
  });
  return {
    client: { messages: { stream: parse } } as unknown as Anthropic,
    parse,
  };
}

describe("HaikuTranslator", () => {
  it("returns the parsed output", async () => {
    const { client } = clientReturning({
      stop_reason: "end_turn",
      parsed_output: output,
    });
    await expect(
      new HaikuTranslator(client).translate({
        text: "me late the train",
        languages,
      }),
    ).resolves.toEqual(output);
  });

  it("reports the tokens the API billed", async () => {
    const { client } = clientReturning({
      stop_reason: "end_turn",
      parsed_output: output,
      usage: { input_tokens: 1234, output_tokens: 321 },
    });
    const result = await new HaikuTranslator(client).translate({
      text: "hola",
      languages,
    });
    expect(result.usage).toEqual({
      model: "claude-haiku-5-5",
      inputTokens: 1234,
      outputTokens: 321,
    });
  });

  it("calls Haiku 5.5 with low effort, the static system prompt and no sampling params", async () => {
    const { client, parse } = clientReturning({
      stop_reason: "end_turn",
      parsed_output: output,
    });
    await new HaikuTranslator(client).translate({ text: "hola", languages });
    const params = (parse.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(TRANSLATION_MODEL).toBe("claude-haiku-5-5");
    expect(params.model).toBe("claude-haiku-5-5");
    expect(params).toMatchObject({ output_config: { effort: "low" } });
    expect(params).not.toHaveProperty("temperature");
    expect(params.messages).toEqual([
      {
        role: "user",
        content: expect.stringContaining("<phrase>\nhola\n</phrase>"),
      },
    ]);
  });

  it("sends the configured effort", async () => {
    const { client, parse } = clientReturning({
      stop_reason: "end_turn",
      parsed_output: output,
    });
    await new HaikuTranslator(client, "medium").translate({
      text: "hola",
      languages,
    });
    const params = (parse.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(params).toMatchObject({ output_config: { effort: "medium" } });
  });

  it("reports each detected language and finished translation once, as the answer grows", async () => {
    const snapshots = [
      '{"detectedLang":"en","transl',
      '{"detectedLang":"en","translations":[{"lang":"es","text":"Lleg',
      '{"detectedLang":"en","translations":[{"lang":"es","text":"Llegué tarde"},{"lang":"en","text":"I w',
      '{"detectedLang":"en","translations":[{"lang":"es","text":"Llegué tarde"},{"lang":"en","text":"I was late"}',
    ];
    const { client } = clientReturning(
      { stop_reason: "end_turn", parsed_output: output },
      snapshots,
    );
    const onProgress = vi.fn();

    await new HaikuTranslator(client).translate(
      { text: "hola", languages },
      { onProgress },
    );

    expect(onProgress.mock.calls.map(([p]) => p)).toEqual([
      { detectedLang: "en", translations: [] },
      {
        detectedLang: "en",
        translations: [{ lang: "es", text: "Llegué tarde" }],
      },
      {
        detectedLang: "en",
        translations: [
          { lang: "es", text: "Llegué tarde" },
          { lang: "en", text: "I was late" },
        ],
      },
    ]);
  });

  it("hands the abort signal to the API call", async () => {
    const { client, parse } = clientReturning({
      stop_reason: "end_turn",
      parsed_output: output,
    });
    const { signal } = new AbortController();

    await new HaikuTranslator(client).translate(
      { text: "hola", languages },
      { signal },
    );

    expect(parse.mock.calls[0][1]).toEqual({ signal });
  });

  it("fails on a refusal", async () => {
    const { client } = clientReturning({
      stop_reason: "refusal",
      parsed_output: null,
    });
    await expect(
      new HaikuTranslator(client).translate({ text: "hola", languages }),
    ).rejects.toBeInstanceOf(TranslationFailedError);
  });

  it("fails when the output could not be parsed", async () => {
    const { client } = clientReturning({
      stop_reason: "max_tokens",
      parsed_output: null,
    });
    await expect(
      new HaikuTranslator(client).translate({ text: "hola", languages }),
    ).rejects.toBeInstanceOf(TranslationFailedError);
  });

  it("wraps API errors", async () => {
    const stream = vi.fn(() => ({
      on: () => undefined,
      finalMessage: async () => {
        throw new Anthropic.APIError(
          529,
          undefined,
          "overloaded",
          new Headers(),
        );
      },
    }));
    const client = { messages: { stream } } as unknown as Anthropic;
    const error = await new HaikuTranslator(client)
      .translate({ text: "hola", languages })
      .catch((e) => e);
    expect(error).toBeInstanceOf(TranslationFailedError);
    expect(error.cause).toBeInstanceOf(Anthropic.APIError);
  });
});
