import { describe, expect, it } from "vitest";
import { meterState } from "./usageMeter";

describe("meterState", () => {
  it("is ok with plenty left", () => {
    expect(meterState(10, 50)).toEqual({
      remaining: 40,
      share: 0.8,
      level: "ok",
    });
  });

  it("turns low at a fifth left, not before", () => {
    expect(meterState(39, 50).level).toBe("ok");
    expect(meterState(40, 50).level).toBe("low");
    expect(meterState(49, 50).level).toBe("low");
  });

  it("is out when nothing is left, even past the limit", () => {
    expect(meterState(50, 50)).toEqual({
      remaining: 0,
      share: 0,
      level: "out",
    });
    expect(meterState(53, 50).remaining).toBe(0);
  });

  it("copes with a zero limit", () => {
    expect(meterState(0, 0).level).toBe("out");
  });
});
