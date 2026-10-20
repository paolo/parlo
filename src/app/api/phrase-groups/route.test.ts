import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import { GET } from "./route";

const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/server/auth/session", () => ({ getSession }));
const repository = vi.hoisted(() => ({ listFavorites: vi.fn() }));
vi.mock("@/server/container", () => ({
  getPhraseRepository: () => repository,
}));

const get = (query: string) =>
  GET(new Request(`http://test/api/phrase-groups${query}`), {
    params: Promise.resolve({}),
  });

describe("GET /api/phrase-groups", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({ userId: "u1" });
  });

  it("lists the user's favorites", async () => {
    const favorites = [{ id: "g2" }, { id: "g1" }] as PhraseGroupDTO[];
    repository.listFavorites.mockResolvedValue(favorites);
    const res = await get("?favorite=true");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: favorites });
    expect(repository.listFavorites).toHaveBeenCalledWith("u1");
  });

  it("rejects listing without favorite=true until history exists", async () => {
    const res = await get("");
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_input" });
    expect(repository.listFavorites).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    getSession.mockResolvedValue(null);
    expect((await get("?favorite=true")).status).toBe(401);
  });
});
