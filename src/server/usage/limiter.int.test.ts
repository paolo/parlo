import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/server/db/client";
import { translationUsage, user } from "@/server/db/schema";
import { createTestUser, resetDb } from "@/test/db";
import { PostgresUsageLimiter } from "./limiter";

const now = new Date("2026-10-10T15:30:00Z");
const limits = { defaultDailyLimit: 3, burstLimit: 2 };

function limiterAt(at: Date) {
  return new PostgresUsageLimiter(getDb(), limits, () => at);
}

async function usageAt(userId: string, createdAt: Date) {
  await getDb().insert(translationUsage).values({ userId, createdAt });
}

describe("PostgresUsageLimiter", () => {
  beforeEach(resetDb);

  it("records usage and reports it", async () => {
    const owner = await createTestUser();
    const limiter = limiterAt(now);
    await limiter.record(owner.id);
    expect(await limiter.usage(owner.id)).toEqual({
      usedToday: 1,
      dailyLimit: 3,
      resetAt: new Date("2026-10-11T00:00:00Z"),
    });
  });

  it("does not count yesterday's usage (UTC)", async () => {
    const owner = await createTestUser();
    await usageAt(owner.id, new Date("2026-10-09T23:59:59Z"));
    await usageAt(owner.id, new Date("2026-10-10T00:00:00Z"));
    expect((await limiterAt(now).usage(owner.id)).usedToday).toBe(1);
  });

  it("blocks bursts within the last minute only", async () => {
    const owner = await createTestUser();
    await usageAt(owner.id, new Date("2026-10-10T15:29:30Z"));
    await usageAt(owner.id, new Date("2026-10-10T15:29:45Z"));
    expect(await limiterAt(now).check(owner.id)).toMatchObject({
      ok: false,
      reason: "burst",
    });
    // Two minutes later both are outside the window, and 2 of 3 daily uses remain.
    expect(
      await limiterAt(new Date("2026-10-10T15:32:00Z")).check(owner.id),
    ).toEqual({ ok: true });
  });

  it("blocks once the daily limit is used up", async () => {
    const owner = await createTestUser();
    for (const time of ["08:00", "09:00", "10:00"]) {
      await usageAt(owner.id, new Date(`2026-10-10T${time}:00Z`));
    }
    expect(await limiterAt(now).check(owner.id)).toEqual({
      ok: false,
      reason: "daily",
      resetAt: new Date("2026-10-11T00:00:00Z"),
    });
  });

  it("uses the per-user daily limit override", async () => {
    const owner = await createTestUser();
    await getDb()
      .update(user)
      .set({ dailyLimit: 10 })
      .where(eq(user.id, owner.id));
    for (const time of ["08:00", "09:00", "10:00"]) {
      await usageAt(owner.id, new Date(`2026-10-10T${time}:00Z`));
    }
    expect(await limiterAt(now).check(owner.id)).toEqual({ ok: true });
    expect((await limiterAt(now).usage(owner.id)).dailyLimit).toBe(10);
  });

  it("counts each user separately", async () => {
    const busy = await createTestUser();
    const idle = await createTestUser();
    for (const time of ["08:00", "09:00", "10:00"]) {
      await usageAt(busy.id, new Date(`2026-10-10T${time}:00Z`));
    }
    expect(await limiterAt(now).check(idle.id)).toEqual({ ok: true });
  });
});
