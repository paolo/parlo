import { z } from "zod";
import {
  getPhraseRepository,
  getTranslator,
  getUsageLimiter,
} from "@/server/container";
import { jsonError, withSession } from "@/server/http/responses";
import { parseJson } from "@/server/http/validation";
import { buildNewGroup } from "@/server/phrases/service";
import { DEFAULT_LEVELS } from "@/server/profile/defaults";
import { TranslationFailedError } from "@/server/translation/types";

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

  const limiter = getUsageLimiter();
  const decision = await limiter.check(userId);
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

  // Task 1.9 replaces the defaults with the user's stored levels.
  const levels = DEFAULT_LEVELS;

  let result: Awaited<
    ReturnType<ReturnType<typeof getTranslator>["translate"]>
  >;
  try {
    result = await getTranslator().translate({ text, levels });
  } catch (error) {
    if (!(error instanceof TranslationFailedError)) throw error;
    console.error("Translation failed", error);
    return jsonError(502, "translation_failed");
  }
  if (result.detectedLang === "other") {
    return jsonError(422, "unsupported_language");
  }

  const group = await getPhraseRepository().insertGroup(
    buildNewGroup(userId, text, result),
  );
  await limiter.record(userId);
  return Response.json({ group }, { status: 201 });
});
