import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import { PhrasebookFullError } from "@/server/phrases/types";
import { DELETE, PATCH } from "./route";

const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/server/auth/session", () => ({ getSession }));
const repository = vi.hoisted(() => ({
  setFavorite: vi.fn(),
  deleteGroup: vi.fn(),
}));
vi.mock("@/server/container", () => ({
  getPhraseRepository: () => repository,
}));

const starred = { id: "g1", isFavorite: true } as PhraseGroupDTO;

function patch(body: unknown) {
  return PATCH(
    new Request("http://test/api/phrase-groups/g1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "g1" }) },
  );
}

describe("PATCH /api/phrase-groups/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({ userId: "u1" });
  });

  it("stars the user's group and returns it", async () => {
    repository.setFavorite.mockResolvedValue(starred);
    const res = await patch({ isFavorite: true });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ group: starred });
    expect(repository.setFavorite).toHaveBeenCalledWith("u1", "g1", true);
  });

  it("returns 404 when the group isn't the user's", async () => {
    repository.setFavorite.mockResolvedValue(null);
    const res = await patch({ isFavorite: false });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
  });

  it.each([
    ["missing isFavorite", {}],
    ["a non-boolean isFavorite", { isFavorite: "yes" }],
  ])("rejects %s with 400", async (_name, body) => {
    const res = await patch(body);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_input" });
    expect(repository.setFavorite).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    getSession.mockResolvedValue(null);
    expect((await patch({ isFavorite: true })).status).toBe(401);
  });

  it("returns 409 with the limit when the phrasebook is full", async () => {
    repository.setFavorite.mockRejectedValue(new PhrasebookFullError(100));
    const res = await patch({ isFavorite: true });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "phrasebook_full", limit: 100 });
  });
});

describe("DELETE /api/phrase-groups/:id", () => {
  const del = () =>
    DELETE(
      new Request("http://test/api/phrase-groups/g1", { method: "DELETE" }),
      {
        params: Promise.resolve({ id: "g1" }),
      },
    );

  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({ userId: "u1" });
  });

  it("deletes the user's group and returns 204", async () => {
    repository.deleteGroup.mockResolvedValue(true);
    const res = await del();
    expect(res.status).toBe(204);
    expect(repository.deleteGroup).toHaveBeenCalledWith("u1", "g1");
  });

  it("returns 404 when the group isn't the user's", async () => {
    repository.deleteGroup.mockResolvedValue(false);
    const res = await del();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
  });

  it("requires a session", async () => {
    getSession.mockResolvedValue(null);
    expect((await del()).status).toBe(401);
  });
});
