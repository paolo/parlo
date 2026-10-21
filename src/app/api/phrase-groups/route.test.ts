import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import { GET } from "./route";

const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/server/auth/session", () => ({ getSession }));
const repository = vi.hoisted(() => ({ listGroups: vi.fn() }));
vi.mock("@/server/container", () => ({
  getPhraseRepository: () => repository,
}));

const get = (query: string) =>
  GET(new Request(`http://test/api/phrase-groups${query}`), {
    params: Promise.resolve({}),
  });

const items = [{ id: "g2" }, { id: "g1" }] as PhraseGroupDTO[];
const validCursor = Buffer.from(
  JSON.stringify({
    c: "2026-10-21 13:00:00.000123+00",
    i: "6f1c1f0e-2b7a-4b53-9a43-0d5e3a1f2c11",
  }),
).toString("base64url");

describe("GET /api/phrase-groups", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({ userId: "u1" });
    repository.listGroups.mockResolvedValue({ items, nextCursor: null });
  });

  it("lists the user's groups 20 at a time by default, with the history limit", async () => {
    const res = await get("");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items, nextCursor: null, limit: 500 });
    expect(repository.listGroups).toHaveBeenCalledWith("u1", {
      favorite: false,
      limit: 20,
      cursor: undefined,
    });
  });

  it("lists only starred groups with favorite=true, with the phrasebook limit", async () => {
    const res = await get("?favorite=true&limit=100");

    expect(await res.json()).toMatchObject({ limit: 100 });
    expect(repository.listGroups).toHaveBeenCalledWith("u1", {
      favorite: true,
      limit: 100,
      cursor: undefined,
    });
  });

  it("passes a valid cursor through and returns the next one", async () => {
    repository.listGroups.mockResolvedValue({ items, nextCursor: "next" });

    const res = await get(`?cursor=${validCursor}`);

    expect((await res.json()).nextCursor).toBe("next");
    expect(repository.listGroups).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ cursor: validCursor }),
    );
  });

  it.each([
    ["limit 0", "?limit=0"],
    ["limit 101", "?limit=101"],
    ["a non-numeric limit", "?limit=x"],
    ["a malformed cursor", "?cursor=garbage"],
    ["an unknown favorite value", "?favorite=maybe"],
  ])("rejects %s with 400 without querying", async (_name, query) => {
    const res = await get(query);

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_input" });
    expect(repository.listGroups).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    getSession.mockResolvedValue(null);
    expect((await get("")).status).toBe(401);
  });
});
