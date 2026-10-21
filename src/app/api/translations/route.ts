import { z } from "zod";
import {
  getPhraseRepository,
  getProfileRepository,
  getTranslator,
  getUsageLimiter,
} from "@/server/container";
import { jsonError, withSession } from "@/server/http/responses";
import { parseJson } from "@/server/http/validation";
import { buildNewGroup } from "@/server/phrases/service";
import { isProfileComplete } from "@/server/profile/service";
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

  const languages = await getProfileRepository().getProfile(userId);
  if (!isProfileComplete(languages))
    return jsonError(409, "profile_incomplete");

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

  let group: ReturnType<typeof buildNewGroup>;
  try {
    const result = await getTranslator().translate({ text, languages });
    const profileLangs = languages.map((l) => l.lang);
    if (
      result.detectedLang === "other" ||
      !profileLangs.includes(result.detectedLang)
    ) {
      return jsonError(422, "unsupported_language", {
        languages: profileLangs,
      });
    }
    group = buildNewGroup(userId, text, result, languages);
  } catch (error) {
    if (!(error instanceof TranslationFailedError)) throw error;
    console.error("Translation failed", error);
    return jsonError(502, "translation_failed");
  }

  const saved = await getPhraseRepository().insertGroup(group);
  await limiter.record(userId);
  return Response.json({ group: saved }, { status: 201 });
});
