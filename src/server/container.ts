import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "./db/client";
import { getEnv } from "./env";
import { DrizzlePhraseRepository } from "./phrases/repository";
import type { PhraseRepository } from "./phrases/types";
import { DrizzleProfileRepository } from "./profile/repository";
import type { ProfileRepository } from "./profile/types";
import { HaikuTranslator } from "./translation/haiku";
import type { Translator } from "./translation/types";
import { PostgresUsageLimiter, type UsageLimiter } from "./usage/limiter";

// Composition root: builds the real implementations on first use. Route tests mock this module.

let limiter: UsageLimiter | undefined;

export function getUsageLimiter(): UsageLimiter {
  limiter ??= new PostgresUsageLimiter(getDb(), {
    defaultDailyLimit: getEnv().DAILY_TRANSLATION_LIMIT,
    burstLimit: getEnv().BURST_LIMIT_PER_MINUTE,
  });
  return limiter;
}

let translator: Translator | undefined;

export function getTranslator(): Translator {
  translator ??= new HaikuTranslator(
    new Anthropic({ apiKey: getEnv().ANTHROPIC_API_KEY }),
  );
  return translator;
}

let phraseRepository: PhraseRepository | undefined;

export function getPhraseRepository(): PhraseRepository {
  phraseRepository ??= new DrizzlePhraseRepository(getDb(), {
    historyLimit: getEnv().HISTORY_LIMIT,
    phrasebookLimit: getEnv().PHRASEBOOK_LIMIT,
  });
  return phraseRepository;
}

let profileRepository: ProfileRepository | undefined;

export function getProfileRepository(): ProfileRepository {
  profileRepository ??= new DrizzleProfileRepository(getDb());
  return profileRepository;
}
