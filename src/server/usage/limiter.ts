import { and, eq, gte, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { translationUsage, user } from "../db/schema";
import { ACTION_COSTS, type UsageAction } from "./costs";
import {
  BURST_WINDOW_MS,
  decide,
  type LimitDecision,
  nextUtcMidnight,
  startOfUtcDay,
} from "./decide";

export interface UsageSummary {
  usedToday: number;
  dailyLimit: number;
  resetAt: Date;
}

/** What the model provider billed for a call. */
export interface TokenUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface UsageLimiter {
  /** Whether `action` fits in what is left today (a translation when omitted). */
  check(userId: string, action?: UsageAction): Promise<LimitDecision>;
  /** Call only after the action succeeded. Adds its cost, and the provider's token counts when known. */
  record(
    userId: string,
    action?: UsageAction,
    tokens?: TokenUsage,
  ): Promise<void>;
  usage(userId: string): Promise<UsageSummary>;
}

export interface UsageLimits {
  defaultDailyLimit: number;
  burstLimit: number;
}

/**
 * Sums the cost of the rows in translation_usage (the ledger). Check-then-record is not atomic: concurrent requests can slip a
 * few over the limit. Acceptable for now; plan task 2.1 makes it atomic.
 */
export class PostgresUsageLimiter implements UsageLimiter {
  constructor(
    private readonly db: Db,
    private readonly limits: UsageLimits,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async check(
    userId: string,
    action: UsageAction = "translation",
  ): Promise<LimitDecision> {
    const now = this.clock();
    const counts = await this.counts(userId, now);
    return decide({
      ...counts,
      cost: ACTION_COSTS[action],
      burstLimit: this.limits.burstLimit,
      now,
    });
  }

  async record(
    userId: string,
    action: UsageAction = "translation",
    tokens?: TokenUsage,
  ): Promise<void> {
    await this.db.insert(translationUsage).values({
      userId,
      action,
      cost: ACTION_COSTS[action],
      model: tokens?.model,
      inputTokens: tokens?.inputTokens,
      outputTokens: tokens?.outputTokens,
      createdAt: this.clock(),
    });
  }

  async usage(userId: string): Promise<UsageSummary> {
    const now = this.clock();
    const { todaySpent, dailyLimit } = await this.counts(userId, now);
    return { usedToday: todaySpent, dailyLimit, resetAt: nextUtcMidnight(now) };
  }

  /** One query: today's spend in allowance units, last-minute request count and the user's limit override. */
  private async counts(userId: string, now: Date) {
    const dayStart = startOfUtcDay(now);
    const windowStart = new Date(now.getTime() - BURST_WINDOW_MS);
    const since = dayStart < windowStart ? dayStart : windowStart;

    const [row] = await this.db
      .select({
        todaySpent:
          sql<number>`coalesce(sum(${translationUsage.cost}) filter (where ${translationUsage.createdAt} >= ${dayStart}), 0)`.mapWith(
            Number,
          ),
        minuteCount:
          sql<number>`count(*) filter (where ${translationUsage.createdAt} >= ${windowStart})`.mapWith(
            Number,
          ),
        dailyLimitOverride: sql<
          number | null
        >`(select ${user.dailyLimit} from ${user} where ${user.id} = ${userId})`,
      })
      .from(translationUsage)
      .where(
        and(
          eq(translationUsage.userId, userId),
          gte(translationUsage.createdAt, since),
        ),
      );

    return {
      todaySpent: row.todaySpent,
      minuteCount: row.minuteCount,
      dailyLimit: row.dailyLimitOverride ?? this.limits.defaultDailyLimit,
    };
  }
}
