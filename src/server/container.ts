import { getDb } from "./db/client";
import { getEnv } from "./env";
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
