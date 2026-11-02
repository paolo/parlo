import { after } from "next/server";
import { z } from "zod";
import {
  getPhraseRepository,
  getProfileRepository,
  getTranslator,
  getUsageLimiter,
} from "@/server/container";
import { NdjsonStream } from "@/server/http/ndjson";
import { jsonError, withSession } from "@/server/http/responses";
import { ServerTimer } from "@/server/http/timing";
import { parseJson } from "@/server/http/validation";
import { buildNewGroup, describeNewGroup } from "@/server/phrases/service";
import { isProfileComplete } from "@/server/profile/service";
import type { TranslationEvent } from "@/server/translation/events";
import { TranslationFailedError } from "@/server/translation/types";
import type { Lang } from "@/shared/languages";

export const MAX_PHRASE_LENGTH = 500;

const bodySchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Type a phrase to translate")
    .max(MAX_PHRASE_LENGTH),
});

export const POST = withSession(async (req, { userId }) => {
  const parsed = await parseJson(req, bodySchema);
  if ("response" in parsed) return parsed.response;
  const { text } = parsed.data;

  const timer = new ServerTimer();
  const languages = await timer.time("profile", () =>
    getProfileRepository().getProfile(userId),
  );
  if (!isProfileComplete(languages))
    return jsonError(409, "profile_incomplete");

  const limiter = getUsageLimiter();
  const decision = await timer.time("limit", () =>
    limiter.check(userId, "translation"),
  );
  if (!decision.ok) {
    const retryAfter = Math.max(
      1,
      Math.ceil((decision.resetAt.getTime() - Date.now()) / 1000),
    );
    return Response.json(
      {
        error: "rate_limited",
        reason: decision.reason,
        resetAt: decision.resetAt,
      },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  // The model's answer is streamed. Nothing is sent until it has said which language the phrase is in, so
  // a phrase we can't translate still gets a plain 422; after that, status 201 and one JSON line per event.
  const events = new NdjsonStream<TranslationEvent>();
  const profileLangs = languages.map((l) => l.lang);
  const detected = Promise.withResolvers<Lang | "other">();
  const abort = new AbortController();
  let sentDetected = false;
  let sentTranslations = 0;
  const run = getTranslator().translate(
    { text, languages },
    {
      signal: abort.signal,
      onProgress: (progress) => {
        if (progress.detectedLang && !sentDetected) {
          sentDetected = true;
          if (progress.detectedLang !== "other") {
            events.push({ type: "detected", lang: progress.detectedLang });
          }
          detected.resolve(progress.detectedLang);
        }
        for (const t of progress.translations.slice(sentTranslations)) {
          events.push({ type: "translation", ...t });
        }
        sentTranslations = progress.translations.length;
      },
    },
  );
  run.then(
    (result) => detected.resolve(result.detectedLang),
    (error) => detected.reject(error),
  );

  let detectedLang: Lang | "other";
  try {
    detectedLang = await timer.time("detect", () => detected.promise);
  } catch (error) {
    if (!(error instanceof TranslationFailedError)) throw error;
    console.error("Translation failed", error);
    return jsonError(502, "translation_failed");
  }
  if (detectedLang === "other" || !profileLangs.includes(detectedLang)) {
    abort.abort();
    return jsonError(422, "unsupported_language", { languages: profileLangs });
  }

  const modelStarted = performance.now();
  void (async () => {
    try {
      const result = await run;
      const group = buildNewGroup(userId, text, result, languages);
      // The answer is on screen already; the group gets its id and time here so the last line can describe
      // it, and the write runs beside the usage record and on past the response. Usage is still awaited:
      // the quota meter refetches right after, and the ledger is what stops runaway spend.
      const stored = {
        ...group,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      const saveStarted = performance.now();
      after(
        getPhraseRepository()
          .insertGroup(stored)
          .then(
            () =>
              console.info(
                `Translation saved in ${(performance.now() - saveStarted).toFixed(1)}ms`,
              ),
            (error) => console.error("Saving a translation failed", error),
          ),
      );
      await timer.time("record", () =>
        limiter.record(userId, "translation", result.usage),
      );
      console.info(
        "Translation timing",
        timer.header(),
        `answer;dur=${(performance.now() - modelStarted).toFixed(1)}`,
      );
      events.push({ type: "done", group: describeNewGroup(stored) });
    } catch (error) {
      console.error("Translation failed", error);
      events.push({ type: "error", error: "translation_failed" });
    } finally {
      events.close();
    }
  })();

  return events.response({
    status: 201,
    headers: { "Server-Timing": timer.header() },
  });
});
