import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./api";
import { streamTranslation } from "./translateStream";

const group = { id: "g1" };

/** A response whose body arrives in the given chunks, so lines can be cut anywhere. */
function streamed(chunks: string[], status = 201) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
    { status },
  );
}

function fetching(response: Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => response),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("streamTranslation", () => {
  it("reports the language and each translation as they arrive, then resolves with the group", async () => {
    fetching(
      streamed([
        '{"type":"detected","lang":"en"}\n{"type":"transl',
        'ation","lang":"es","text":"Hola"}\n',
        '{"type":"translation","lang":"fr","text":"Salut"}\n{"type":"done","group":{"id":"g1"}}\n',
      ]),
    );
    const seen: unknown[] = [];

    const result = await streamTranslation("hi", (p) => seen.push(p));

    expect(result).toEqual({ group });
    expect(seen).toEqual([
      { detected: "en", translations: [] },
      { detected: "en", translations: [{ lang: "es", text: "Hola" }] },
      {
        detected: "en",
        translations: [
          { lang: "es", text: "Hola" },
          { lang: "fr", text: "Salut" },
        ],
      },
    ]);
  });

  it("sends the phrase as JSON", async () => {
    fetching(streamed(['{"type":"done","group":{"id":"g1"}}\n']));

    await streamTranslation("hola", () => {});

    expect(fetch).toHaveBeenCalledWith(
      "/api/translations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "hola" }),
      }),
    );
  });

  it("throws an ApiError with the body when the request is refused up front", async () => {
    fetching(
      Response.json(
        { error: "rate_limited", reason: "burst" },
        { status: 429 },
      ),
    );

    const error = await streamTranslation("hi", () => {}).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(429);
    expect(error.body).toEqual({ error: "rate_limited", reason: "burst" });
  });

  it("throws translation_failed when the answer ends with an error line", async () => {
    fetching(
      streamed([
        '{"type":"detected","lang":"en"}\n{"type":"error","error":"translation_failed"}\n',
      ]),
    );

    const error = await streamTranslation("hi", () => {}).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.body).toEqual({ error: "translation_failed" });
  });

  it("throws save_failed when the answer could not be saved", async () => {
    fetching(
      streamed([
        '{"type":"detected","lang":"en"}\n{"type":"error","error":"save_failed"}\n',
      ]),
    );

    const error = await streamTranslation("hi", () => {}).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.body).toEqual({ error: "save_failed" });
  });

  it("throws translation_failed when the stream stops before its last line", async () => {
    fetching(streamed(['{"type":"detected","lang":"en"}\n{"type":"transl']));

    const error = await streamTranslation("hi", () => {}).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.body).toEqual({ error: "translation_failed" });
  });
});
