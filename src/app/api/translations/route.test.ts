import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NewPhraseGroup, PhraseGroupDTO } from "@/server/phrases/types";
import { buildProfile } from "@/server/profile/service";
import { FakeTranslator } from "@/server/translation/fake";
import {
  TranslationFailedError,
  type TranslationResult,
} from "@/server/translation/types";
import { POST } from "./route";

const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/server/auth/session", () => ({ getSession }));

const deps = vi.hoisted(() => ({
  limiter: { check: vi.fn(), record: vi.fn(), usage: vi.fn() },
  repository: { insertGroup: vi.fn(), findById: vi.fn() },
  profiles: { getProfile: vi.fn(), replaceProfile: vi.fn() },
  translator: undefined as unknown,
}));
vi.mock("@/server/container", () => ({
  getUsageLimiter: () => deps.limiter,
  getPhraseRepository: () => deps.repository,
  getProfileRepository: () => deps.profiles,
  getTranslator: () => deps.translator,
}));

const result: TranslationResult = {
  detectedLang: "en",
  correction: {
    text: "I'm going to miss the train",
    explanation: "«Me late» no es inglés.",
  },
  translations: [
    { lang: "es", text: "Voy a perder el tren" },
    { lang: "en", text: "I'm going to miss the train" },
    { lang: "fr", text: "Je vais rater le train" },
  ],
  notes: null,
};

const esEnFr = buildProfile([
  { lang: "es", region: "BO" },
  { lang: "en" },
  { lang: "fr" },
]);
const savedGroup = { id: "g1" } as PhraseGroupDTO;

function post(body: unknown) {
  return POST(
    new Request("http://test/api/translations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    { params: Promise.resolve({}) },
  );
}

describe("POST /api/translations", () => {
  let translator: FakeTranslator;

  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({ userId: "u1" });
    deps.limiter.check.mockResolvedValue({ ok: true });
    deps.repository.insertGroup.mockResolvedValue(savedGroup);
    deps.profiles.getProfile.mockResolvedValue(esEnFr);
    translator = new FakeTranslator(result);
    deps.translator = translator;
  });

  it("translates, saves the group, records usage and returns 201", async () => {
    const res = await post({ text: "  me late the train  " });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ group: savedGroup });
    expect(translator.calls[0].text).toBe("me late the train");
    expect(translator.calls[0].languages).toEqual(esEnFr);
    const saved = deps.repository.insertGroup.mock
      .calls[0][0] as NewPhraseGroup;
    expect(saved.userId).toBe("u1");
    expect(saved.phrases.find((p) => p.isRoot)).toEqual({
      lang: "en",
      text: "me late the train",
      isRoot: true,
    });
    expect(deps.limiter.record).toHaveBeenCalledWith("u1");
  });

  it.each([
    ["missing text", {}],
    ["whitespace only", { text: "   " }],
    ["over 500 characters", { text: "a".repeat(501) }],
    ["not a string", { text: 42 }],
  ])("rejects %s with 400", async (_name, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_input" });
    expect(translator.calls).toHaveLength(0);
  });

  it("rejects malformed JSON with 400", async () => {
    expect((await post("{not json")).status).toBe(400);
  });

  it("accepts exactly 500 characters", async () => {
    expect((await post({ text: "a".repeat(500) })).status).toBe(201);
  });

  it("returns 429 with Retry-After and does not call the model when rate limited", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-10T15:30:00Z") });
    deps.limiter.check.mockResolvedValue({
      ok: false,
      reason: "burst",
      resetAt: new Date("2026-10-10T15:31:00Z"),
    });

    const res = await post({ text: "hola" });

    vi.useRealTimers();
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect(await res.json()).toEqual({
      error: "rate_limited",
      reason: "burst",
      resetAt: "2026-10-10T15:31:00.000Z",
    });
    expect(translator.calls).toHaveLength(0);
  });

  it("returns 422 for unsupported languages and records no usage", async () => {
    deps.translator = new FakeTranslator({ ...result, detectedLang: "other" });
    const res = await post({ text: "ciao bella" });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      error: "unsupported_language",
      languages: ["es", "en", "fr"],
    });
    expect(deps.repository.insertGroup).not.toHaveBeenCalled();
    expect(deps.limiter.record).not.toHaveBeenCalled();
  });

  it("returns 422 naming the user's languages for a supported language they did not pick", async () => {
    deps.translator = new FakeTranslator({ ...result, detectedLang: "it" });
    const res = await post({ text: "ciao bella" });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      error: "unsupported_language",
      languages: ["es", "en", "fr"],
    });
    expect(deps.repository.insertGroup).not.toHaveBeenCalled();
    expect(deps.limiter.record).not.toHaveBeenCalled();
  });

  it.each([
    ["no profile", []],
    ["two languages", esEnFr.slice(0, 2)],
  ])("returns 409 with %s, before the limiter or the model", async (_name, profile) => {
    deps.profiles.getProfile.mockResolvedValue(profile);
    const res = await post({ text: "hola" });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "profile_incomplete" });
    expect(deps.limiter.check).not.toHaveBeenCalled();
    expect(translator.calls).toHaveLength(0);
    expect(deps.limiter.record).not.toHaveBeenCalled();
  });

  it("returns 502 and stores nothing when the translations do not cover the profile", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    deps.translator = new FakeTranslator({
      ...result,
      translations: result.translations.slice(0, 2),
    });
    const res = await post({ text: "me late the train" });
    expect(res.status).toBe(502);
    expect(deps.repository.insertGroup).not.toHaveBeenCalled();
    expect(deps.limiter.record).not.toHaveBeenCalled();
  });

  it("creates phrases in the languages of a pt/en/fr profile", async () => {
    deps.profiles.getProfile.mockResolvedValue(
      buildProfile([
        { lang: "pt", region: "BR" },
        { lang: "en" },
        { lang: "fr" },
      ]),
    );
    deps.translator = new FakeTranslator({
      ...result,
      detectedLang: "pt",
      translations: [
        { lang: "pt", text: "Vou perder o trem" },
        { lang: "en", text: "I'm going to miss the train" },
        { lang: "fr", text: "Je vais rater le train" },
      ],
    });
    const res = await post({ text: "vou perder o trem" });
    expect(res.status).toBe(201);
    const saved = deps.repository.insertGroup.mock
      .calls[0][0] as NewPhraseGroup;
    expect(saved.phrases.map((p) => p.lang)).toEqual(["pt", "en", "fr"]);
  });

  it("returns 502 when the model fails and records no usage", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    deps.translator = new FakeTranslator(
      new TranslationFailedError("overloaded"),
    );
    const res = await post({ text: "hola" });
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "translation_failed" });
    expect(deps.repository.insertGroup).not.toHaveBeenCalled();
    expect(deps.limiter.record).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    getSession.mockResolvedValue(null);
    expect((await post({ text: "hola" })).status).toBe(401);
  });
});
