import { and, eq, gte, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { translationUsage, user } from "../db/schema";
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

export interface UsageLimiter {
  check(userId: string): Promise<LimitDecision>;
  /** Call only after a successful translation. */
  record(userId: string): Promise<void>;
  usage(userId: string): Promise<UsageSummary>;
}

export interface UsageLimits {
  defaultDailyLimit: number;
  burstLimit: number;
}

/**
 * Counts rows in translation_usage. Check-then-record is not atomic: concurrent requests can slip a
 * few over the limit. Acceptable for now; plan task 2.1 makes it atomic.
 */
export class PostgresUsageLimiter implements UsageLimiter {
  constructor(
    private readonly db: Db,
    private readonly limits: UsageLimits,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async check(userId: string): Promise<LimitDecision> {
    const now = this.clock();
    const counts = await this.counts(userId, now);
    return decide({ ...counts, burstLimit: this.limits.burstLimit, now });
  }

  async record(userId: string): Promise<void> {
    await this.db
      .insert(translationUsage)
      .values({ userId, createdAt: this.clock() });
  }

  async usage(userId: string): Promise<UsageSummary> {
    const now = this.clock();
    const { todayCount, dailyLimit } = await this.counts(userId, now);
    return { usedToday: todayCount, dailyLimit, resetAt: nextUtcMidnight(now) };
  }

  /** One query: today's count, last-minute count and the user's limit override. */
  private async counts(userId: string, now: Date) {
    const dayStart = startOfUtcDay(now);
    const windowStart = new Date(now.getTime() - BURST_WINDOW_MS);
    const since = dayStart < windowStart ? dayStart : windowStart;

    const [row] = await this.db
      .select({
        todayCount:
          sql<number>`count(*) filter (where ${translationUsage.createdAt} >= ${dayStart})`.mapWith(
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
      todayCount: row.todayCount,
      minuteCount: row.minuteCount,
      dailyLimit: row.dailyLimitOverride ?? this.limits.defaultDailyLimit,
    };
  }
}
