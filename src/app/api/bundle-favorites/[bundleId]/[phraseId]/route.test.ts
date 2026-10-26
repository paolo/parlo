import { beforeEach, describe, expect, it, vi } from "vitest";
import { PhrasebookFullError } from "@/server/phrases/types";
import { DELETE, PUT } from "./route";

const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/server/auth/session", () => ({ getSession }));
const phrases = vi.hoisted(() => ({
  favoriteBundleGroup: vi.fn(),
  deleteBundleGroup: vi.fn(),
}));
const profiles = vi.hoisted(() => ({ getProfile: vi.fn() }));
vi.mock("@/server/container", () => ({
  getPhraseRepository: () => phrases,
  getProfileRepository: () => profiles,
}));

const languages = [
  { lang: "es", region: "ES", level: "native", position: 0 },
  { lang: "en", region: "CA", level: "intermediate", position: 1 },
  { lang: "fr", region: "CA", level: "intermediate", position: 2 },
];

const call = (
  handler: typeof PUT | typeof DELETE,
  bundleId = "starter",
  phraseId = "starter-001",
) =>
  handler(new Request("http://test/api/bundle-favorites", { method: "PUT" }), {
    params: Promise.resolve({ bundleId, phraseId }),
  });

describe("/api/bundle-favorites/:bundleId/:phraseId", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({ userId: "u1" });
    profiles.getProfile.mockResolvedValue(languages);
  });

  describe("PUT", () => {
    it("saves the phrase in the user's languages and returns the group", async () => {
      const group = { id: "g1", isFavorite: true };
      phrases.favoriteBundleGroup.mockResolvedValue(group);

      const res = await call(PUT);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ group });
      const saved = phrases.favoriteBundleGroup.mock.calls[0][0];
      expect(saved).toMatchObject({
        userId: "u1",
        bundleRef: "starter:starter-001",
      });
      expect(saved.phrases.map((p: { lang: string }) => p.lang)).toEqual([
        "es",
        "en",
        "fr",
      ]);
    });

    it("answers 401 without a session", async () => {
      getSession.mockResolvedValue(null);
      expect((await call(PUT)).status).toBe(401);
    });

    it("answers 404 for an unknown phrase or bundle", async () => {
      expect((await call(PUT, "starter", "starter-999")).status).toBe(404);
      expect((await call(PUT, "nope", "starter-001")).status).toBe(404);
      expect(phrases.favoriteBundleGroup).not.toHaveBeenCalled();
    });

    it("answers 409 profile_incomplete without a profile", async () => {
      profiles.getProfile.mockResolvedValue([]);
      const res = await call(PUT);
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: "profile_incomplete" });
    });

    it("answers 409 phrasebook_full at the cap", async () => {
      phrases.favoriteBundleGroup.mockRejectedValue(
        new PhrasebookFullError(100),
      );
      const res = await call(PUT);
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({
        error: "phrasebook_full",
        limit: 100,
      });
    });
  });

  describe("DELETE", () => {
    it("deletes the user's group for the ref and answers 204", async () => {
      phrases.deleteBundleGroup.mockResolvedValue(true);
      const res = await call(DELETE);
      expect(res.status).toBe(204);
      expect(phrases.deleteBundleGroup).toHaveBeenCalledWith(
        "u1",
        "starter:starter-001",
      );
    });

    it("answers 204 even when there was nothing to delete", async () => {
      phrases.deleteBundleGroup.mockResolvedValue(false);
      expect((await call(DELETE)).status).toBe(204);
    });

    it("answers 401 without a session", async () => {
      getSession.mockResolvedValue(null);
      expect((await call(DELETE)).status).toBe(401);
    });
  });
});
