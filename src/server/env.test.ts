import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

const base = {
  DATABASE_URL: "postgres://parlo:parlo@localhost:5432/parlo",
  BETTER_AUTH_SECRET: "secret",
  BETTER_AUTH_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "id",
  GOOGLE_CLIENT_SECRET: "client-secret",
  ANTHROPIC_API_KEY: "key",
};

describe("parseEnv", () => {
  it("applies default limits", () => {
    const env = parseEnv(base);
    expect(env.DAILY_TRANSLATION_LIMIT).toBe(50);
    expect(env.BURST_LIMIT_PER_MINUTE).toBe(10);
  });

  it("coerces numeric strings", () => {
    const env = parseEnv({
      ...base,
      DAILY_TRANSLATION_LIMIT: "5",
      BURST_LIMIT_PER_MINUTE: "2",
    });
    expect(env.DAILY_TRANSLATION_LIMIT).toBe(5);
    expect(env.BURST_LIMIT_PER_MINUTE).toBe(2);
  });

  it("names the missing variable in the error", () => {
    const { ANTHROPIC_API_KEY: _omit, ...rest } = base;
    expect(() => parseEnv(rest)).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("rejects non-positive limits", () => {
    expect(() => parseEnv({ ...base, DAILY_TRANSLATION_LIMIT: "0" })).toThrow(
      /DAILY_TRANSLATION_LIMIT/,
    );
  });
});
