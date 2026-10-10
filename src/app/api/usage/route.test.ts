import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/server/auth/session", () => ({ getSession }));
const limiter = vi.hoisted(() => ({
  check: vi.fn(),
  record: vi.fn(),
  usage: vi.fn(),
}));
vi.mock("@/server/container", () => ({ getUsageLimiter: () => limiter }));

const call = () =>
  GET(new Request("http://test/api/usage"), { params: Promise.resolve({}) });

describe("GET /api/usage", () => {
  beforeEach(() => vi.resetAllMocks());

  it("requires a session", async () => {
    getSession.mockResolvedValue(null);
    expect((await call()).status).toBe(401);
  });

  it("returns today's usage for the signed-in user", async () => {
    getSession.mockResolvedValue({ userId: "u1" });
    limiter.usage.mockResolvedValue({
      usedToday: 12,
      dailyLimit: 50,
      resetAt: new Date("2026-10-11T00:00:00Z"),
    });

    const res = await call();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      usedToday: 12,
      dailyLimit: 50,
      resetAt: "2026-10-11T00:00:00.000Z",
    });
    expect(limiter.usage).toHaveBeenCalledWith("u1");
  });
});
