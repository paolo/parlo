import { beforeEach, describe, expect, it, vi } from "vitest";
import { jsonError, withSession } from "./responses";

const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/server/auth/session", () => ({ getSession }));

describe("jsonError", () => {
  it("returns the status with an error code and extra details", async () => {
    const res = jsonError(429, "rate_limited", { reason: "daily" });
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({
      error: "rate_limited",
      reason: "daily",
    });
  });
});

describe("withSession", () => {
  beforeEach(() => getSession.mockReset());

  it("responds 401 without calling the handler when there is no session", async () => {
    getSession.mockResolvedValue(null);
    const handler = vi.fn();
    const res = await withSession(handler)(new Request("http://test/api/x"), {
      params: Promise.resolve({}),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes the user id and resolved params to the handler", async () => {
    getSession.mockResolvedValue({ userId: "u1" });
    const handler = vi.fn(async () => Response.json({ ok: true }));
    const req = new Request("http://test/api/x");
    const res = await withSession<{ id: string }>(handler)(req, {
      params: Promise.resolve({ id: "g1" }),
    });
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(req, {
      userId: "u1",
      params: { id: "g1" },
    });
  });

  it("turns unexpected errors into a 500 without leaking details", async () => {
    getSession.mockResolvedValue({ userId: "u1" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await withSession(async () => {
      throw new Error("db exploded");
    })(new Request("http://test/api/x"), { params: Promise.resolve({}) });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal_error" });
  });
});
