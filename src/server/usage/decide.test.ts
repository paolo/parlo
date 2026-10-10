import { describe, expect, it } from "vitest";
import { decide, nextUtcMidnight } from "./decide";

const now = new Date("2026-10-10T15:30:00Z");
const base = {
  todayCount: 0,
  minuteCount: 0,
  dailyLimit: 50,
  burstLimit: 10,
  now,
};

describe("decide", () => {
  it("allows requests under both limits", () => {
    expect(decide({ ...base, todayCount: 49, minuteCount: 9 })).toEqual({
      ok: true,
    });
  });

  it("blocks once the daily limit is reached, until the next UTC midnight", () => {
    expect(decide({ ...base, todayCount: 50 })).toEqual({
      ok: false,
      reason: "daily",
      resetAt: new Date("2026-10-11T00:00:00Z"),
    });
  });

  it("blocks bursts for a minute", () => {
    expect(decide({ ...base, minuteCount: 10 })).toEqual({
      ok: false,
      reason: "burst",
      resetAt: new Date("2026-10-10T15:31:00Z"),
    });
  });

  it("reports the daily limit when both apply, since it lasts longer", () => {
    expect(decide({ ...base, todayCount: 50, minuteCount: 10 })).toMatchObject({
      reason: "daily",
    });
  });
});

describe("nextUtcMidnight", () => {
  it("counts the last second of the day toward today", () => {
    expect(nextUtcMidnight(new Date("2026-10-10T23:59:59Z"))).toEqual(
      new Date("2026-10-11T00:00:00Z"),
    );
  });

  it("starts a fresh day exactly at midnight", () => {
    expect(nextUtcMidnight(new Date("2026-10-11T00:00:00Z"))).toEqual(
      new Date("2026-10-12T00:00:00Z"),
    );
  });

  it("rolls over months and years", () => {
    expect(nextUtcMidnight(new Date("2026-12-31T12:00:00Z"))).toEqual(
      new Date("2027-01-01T00:00:00Z"),
    );
  });
});
