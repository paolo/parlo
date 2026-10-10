import { describe, expect, it } from "vitest";

describe("test environment", () => {
  it("loads .env.test, so tests never touch the dev database", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(process.env.DATABASE_URL).toMatch(/\/parlo_test$/);
  });
});
