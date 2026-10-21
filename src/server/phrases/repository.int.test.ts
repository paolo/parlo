import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/server/db/client";
import { createTestUser, resetDb } from "@/test/db";
import { DrizzlePhraseRepository } from "./repository";
import {
  CorrectionNotAcceptableError,
  type NewPhraseGroup,
  PhrasebookFullError,
  type PhraseLimits,
} from "./types";

const newGroup = (userId: string): NewPhraseGroup => ({
  userId,
  notes: "Idiom.",
  correction: { text: "Llegué tarde", explanation: "«Me tarde» no existe." },
  phrases: [
    { lang: "es", text: "me tarde", isRoot: true },
    { lang: "en", text: "I was late", isRoot: false },
    { lang: "fr", text: "J'étais en retard", isRoot: false },
  ],
});

describe("DrizzlePhraseRepository", () => {
  beforeEach(resetDb);
  const repo = (
    limits: PhraseLimits = { historyLimit: 500, phrasebookLimit: 100 },
  ) => new DrizzlePhraseRepository(getDb(), limits);

  it("inserts a group with its three phrases and returns it", async () => {
    const owner = await createTestUser();
    const group = await repo().insertGroup(newGroup(owner.id));

    expect(group).toMatchObject({
      isFavorite: false,
      notes: "Idiom.",
      correction: {
        text: "Llegué tarde",
        explanation: "«Me tarde» no existe.",
        accepted: false,
      },
      phrases: [
        { lang: "es", text: "me tarde", isRoot: true, correctedFrom: null },
        { lang: "en", text: "I was late", isRoot: false },
        { lang: "fr", text: "J'étais en retard", isRoot: false },
      ],
    });
    expect(typeof group.id).toBe("string");
    expect(new Date(group.createdAt).getTime()).not.toBeNaN();
  });

  it("finds a group by id for its owner only", async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const { id } = await repo().insertGroup(newGroup(owner.id));

    expect((await repo().findById(owner.id, id))?.id).toBe(id);
    expect(await repo().findById(stranger.id, id)).toBeNull();
  });

  it("returns null for an unknown or malformed id", async () => {
    const owner = await createTestUser();
    expect(
      await repo().findById(owner.id, "00000000-0000-0000-0000-000000000000"),
    ).toBeNull();
    expect(await repo().findById(owner.id, "not-a-uuid")).toBeNull();
  });

  it("stores nothing when the phrases violate a constraint", async () => {
    const owner = await createTestUser();
    const broken = newGroup(owner.id);
    broken.phrases[1].isRoot = true; // two roots
    await expect(repo().insertGroup(broken)).rejects.toThrow();
    const all = await getDb().query.phraseGroup.findMany();
    expect(all).toHaveLength(0);
  });

  it("stars and unstars a group for its owner only", async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const { id } = await repo().insertGroup(newGroup(owner.id));

    expect(await repo().setFavorite(stranger.id, id, true)).toBeNull();
    expect((await repo().findById(owner.id, id))?.isFavorite).toBe(false);

    const starred = await repo().setFavorite(owner.id, id, true);
    expect(starred).toMatchObject({ id, isFavorite: true });
    expect(starred?.phrases[0].text).toBe("me tarde");

    expect((await repo().setFavorite(owner.id, id, false))?.isFavorite).toBe(
      false,
    );
  });

  it("returns null when starring a malformed id", async () => {
    const owner = await createTestUser();
    expect(await repo().setFavorite(owner.id, "not-a-uuid", true)).toBeNull();
  });

  it("lists only the owner's favorites, newest first", async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const older = await repo().insertGroup(newGroup(owner.id));
    await repo().insertGroup(newGroup(owner.id)); // not starred
    const newer = await repo().insertGroup(newGroup(owner.id));
    const foreign = await repo().insertGroup(newGroup(stranger.id));
    for (const [userId, id] of [
      [owner.id, older.id],
      [owner.id, newer.id],
      [stranger.id, foreign.id],
    ]) {
      await repo().setFavorite(userId, id, true);
    }

    const { items: favorites } = await repo().listGroups(owner.id, {
      favorite: true,
      limit: 20,
    });

    expect(favorites.map((g) => g.id)).toEqual([newer.id, older.id]);
    expect(favorites[0].phrases[2].text).toBe("J'étais en retard");
  });

  it("lists the root first, then the rest in catalog order", async () => {
    const owner = await createTestUser();
    const group = await repo().insertGroup({
      userId: owner.id,
      notes: null,
      correction: null,
      phrases: [
        { lang: "fr", text: "Bonjour", isRoot: false },
        { lang: "pt", text: "Olá", isRoot: true },
        { lang: "en", text: "Hello", isRoot: false },
      ],
    });

    expect(group.phrases.map((p) => p.lang)).toEqual(["pt", "en", "fr"]);
  });

  describe("listGroups", () => {
    async function seed(userId: string, count: number) {
      const ids: string[] = [];
      for (let i = 0; i < count; i++) {
        ids.push((await repo().insertGroup(newGroup(userId))).id);
      }
      return ids;
    }

    async function allPages(userId: string, limit: number, favorite?: boolean) {
      const pages = [];
      let cursor: string | undefined;
      do {
        const page = await repo().listGroups(userId, {
          limit,
          cursor,
          favorite,
        });
        pages.push(page);
        cursor = page.nextCursor ?? undefined;
      } while (cursor);
      return pages;
    }

    it("pages newest first with no duplicates and a null cursor on the last page", async () => {
      const owner = await createTestUser();
      const ids = await seed(owner.id, 5);

      const pages = await allPages(owner.id, 2);

      expect(pages.map((p) => p.items.length)).toEqual([2, 2, 1]);
      expect(pages.flatMap((p) => p.items.map((g) => g.id))).toEqual(
        [...ids].reverse(),
      );
      expect(pages[2].nextCursor).toBeNull();
      expect(pages[0].nextCursor).not.toBeNull();
    });

    it("has no next page when the items exactly fill the page", async () => {
      const owner = await createTestUser();
      await seed(owner.id, 2);

      const page = await repo().listGroups(owner.id, { limit: 2 });

      expect(page.items).toHaveLength(2);
      expect(page.nextCursor).toBeNull();
    });

    it("neither skips nor repeats groups created within the same millisecond", async () => {
      const owner = await createTestUser();
      const [c, a, b] = await seed(owner.id, 3);
      // Same millisecond, different microseconds: a JS Date cannot tell a and b apart.
      for (const [id, at] of [
        [c, "2026-01-01 10:00:00.005000+00"],
        [a, "2026-01-01 10:00:00.000900+00"],
        [b, "2026-01-01 10:00:00.000100+00"],
      ]) {
        await getDb().execute(
          sql`update phrase_group set created_at = ${at}::timestamptz where id = ${id}`,
        );
      }

      const pages = await allPages(owner.id, 1);

      expect(pages.flatMap((p) => p.items.map((g) => g.id))).toEqual([c, a, b]);
    });

    it("never returns another user's groups", async () => {
      const owner = await createTestUser();
      const stranger = await createTestUser();
      await seed(stranger.id, 3);
      const [mine] = await seed(owner.id, 1);

      const page = await repo().listGroups(owner.id, { limit: 20 });

      expect(page.items.map((g) => g.id)).toEqual([mine]);
    });

    it("lists only starred groups, with the same paging, when favorite is set", async () => {
      const owner = await createTestUser();
      const ids = await seed(owner.id, 4);
      await repo().setFavorite(owner.id, ids[0], true);
      await repo().setFavorite(owner.id, ids[2], true);

      const pages = await allPages(owner.id, 1, true);

      expect(pages.flatMap((p) => p.items.map((g) => g.id))).toEqual([
        ids[2],
        ids[0],
      ]);
    });
  });

  describe("deleteGroup", () => {
    it("deletes the owner's group and its phrases", async () => {
      const owner = await createTestUser();
      const { id } = await repo().insertGroup(newGroup(owner.id));

      expect(await repo().deleteGroup(owner.id, id)).toBe(true);

      expect(await repo().findById(owner.id, id)).toBeNull();
      expect(await getDb().query.phrase.findMany()).toHaveLength(0);
    });

    it("returns false and deletes nothing for a stranger's group or a malformed id", async () => {
      const owner = await createTestUser();
      const stranger = await createTestUser();
      const { id } = await repo().insertGroup(newGroup(owner.id));

      expect(await repo().deleteGroup(stranger.id, id)).toBe(false);
      expect(await repo().deleteGroup(owner.id, "not-a-uuid")).toBe(false);

      expect(await repo().findById(owner.id, id)).not.toBeNull();
    });
  });

  describe("history pruning", () => {
    const small = { historyLimit: 3, phrasebookLimit: 100 };
    const listIds = async (userId: string) =>
      (await repo().listGroups(userId, { limit: 100 })).items.map((g) => g.id);

    it("removes the oldest group once the limit is passed and keeps the newest", async () => {
      const owner = await createTestUser();
      const ids: string[] = [];
      for (let i = 0; i < 4; i++) {
        ids.push((await repo(small).insertGroup(newGroup(owner.id))).id);
      }

      expect(await listIds(owner.id)).toEqual([ids[3], ids[2], ids[1]]);
    });

    it("spares a starred group and removes the oldest unstarred one instead", async () => {
      const owner = await createTestUser();
      const first = await repo(small).insertGroup(newGroup(owner.id));
      await repo(small).setFavorite(owner.id, first.id, true);
      const ids = [first.id];
      for (let i = 0; i < 3; i++) {
        ids.push((await repo(small).insertGroup(newGroup(owner.id))).id);
      }

      expect(await listIds(owner.id)).toEqual([ids[3], ids[2], ids[0]]);
    });

    it("deletes nothing when only starred groups and the new one are left, even over the limit", async () => {
      const owner = await createTestUser();
      for (let i = 0; i < 3; i++) {
        const g = await repo().insertGroup(newGroup(owner.id));
        await repo().setFavorite(owner.id, g.id, true);
      }
      await repo({ historyLimit: 2, phrasebookLimit: 100 }).insertGroup(
        newGroup(owner.id),
      );

      // Over the limit, but the only unstarred group is the one just saved: all four stay.
      expect(await listIds(owner.id)).toHaveLength(4);
      const starred = await repo().listGroups(owner.id, {
        favorite: true,
        limit: 100,
      });
      expect(starred.items).toHaveLength(3);
    });

    it("never prunes another user's groups", async () => {
      const owner = await createTestUser();
      const other = await createTestUser();
      for (let i = 0; i < 3; i++)
        await repo(small).insertGroup(newGroup(other.id));
      for (let i = 0; i < 4; i++)
        await repo(small).insertGroup(newGroup(owner.id));

      expect(await listIds(other.id)).toHaveLength(3);
    });
  });

  describe("phrasebook cap", () => {
    const capped = { historyLimit: 500, phrasebookLimit: 2 };

    it("refuses a third star with the limit, but allows re-starring and unstarring", async () => {
      const owner = await createTestUser();
      const [a, b, c] = [
        await repo(capped).insertGroup(newGroup(owner.id)),
        await repo(capped).insertGroup(newGroup(owner.id)),
        await repo(capped).insertGroup(newGroup(owner.id)),
      ];
      await repo(capped).setFavorite(owner.id, a.id, true);
      await repo(capped).setFavorite(owner.id, b.id, true);

      await expect(
        repo(capped).setFavorite(owner.id, c.id, true),
      ).rejects.toEqual(expect.objectContaining({ limit: 2 }));
      await expect(
        repo(capped).setFavorite(owner.id, c.id, true),
      ).rejects.toBeInstanceOf(PhrasebookFullError);

      expect(
        (await repo(capped).setFavorite(owner.id, a.id, true))?.isFavorite,
      ).toBe(true);
      expect(
        (await repo(capped).setFavorite(owner.id, a.id, false))?.isFavorite,
      ).toBe(false);
      expect(
        (await repo(capped).setFavorite(owner.id, c.id, true))?.isFavorite,
      ).toBe(true);
    });

    it("counts only the user's own stars", async () => {
      const owner = await createTestUser();
      const other = await createTestUser();
      for (let i = 0; i < 2; i++) {
        const g = await repo(capped).insertGroup(newGroup(other.id));
        await repo(capped).setFavorite(other.id, g.id, true);
      }
      const mine = await repo(capped).insertGroup(newGroup(owner.id));

      expect(
        (await repo(capped).setFavorite(owner.id, mine.id, true))?.isFavorite,
      ).toBe(true);
    });
  });

  describe("acceptCorrection", () => {
    it("makes the correction the root text and keeps the typed text", async () => {
      const owner = await createTestUser();
      const { id } = await repo().insertGroup(newGroup(owner.id));

      const group = await repo().acceptCorrection(owner.id, id);

      expect(group?.correction).toMatchObject({
        text: "Llegué tarde",
        accepted: true,
      });
      expect(group?.phrases).toEqual([
        {
          lang: "es",
          text: "Llegué tarde",
          isRoot: true,
          correctedFrom: "me tarde",
        },
        { lang: "en", text: "I was late", isRoot: false, correctedFrom: null },
        {
          lang: "fr",
          text: "J'étais en retard",
          isRoot: false,
          correctedFrom: null,
        },
      ]);
      expect(await repo().findById(owner.id, id)).toEqual(group);
    });

    it("refuses a second accept and leaves the group as it was", async () => {
      const owner = await createTestUser();
      const { id } = await repo().insertGroup(newGroup(owner.id));
      const accepted = await repo().acceptCorrection(owner.id, id);

      await expect(repo().acceptCorrection(owner.id, id)).rejects.toMatchObject(
        { code: "already_accepted" },
      );
      await expect(
        repo().acceptCorrection(owner.id, id),
      ).rejects.toBeInstanceOf(CorrectionNotAcceptableError);

      expect(await repo().findById(owner.id, id)).toEqual(accepted);
      expect(accepted?.phrases[0].correctedFrom).toBe("me tarde");
    });

    it("applies once when two accepts race", async () => {
      const owner = await createTestUser();
      const { id } = await repo().insertGroup(newGroup(owner.id));

      const results = await Promise.allSettled([
        repo().acceptCorrection(owner.id, id),
        repo().acceptCorrection(owner.id, id),
      ]);

      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      const stored = await repo().findById(owner.id, id);
      expect(stored?.phrases[0]).toMatchObject({
        text: "Llegué tarde",
        correctedFrom: "me tarde",
      });
    });

    it("refuses a group saved without a correction", async () => {
      const owner = await createTestUser();
      const { id } = await repo().insertGroup({
        ...newGroup(owner.id),
        correction: null,
      });

      await expect(repo().acceptCorrection(owner.id, id)).rejects.toMatchObject(
        { code: "no_correction" },
      );
    });

    it("returns null for a stranger's group and a malformed id", async () => {
      const owner = await createTestUser();
      const stranger = await createTestUser();
      const { id } = await repo().insertGroup(newGroup(owner.id));

      expect(await repo().acceptCorrection(stranger.id, id)).toBeNull();
      expect(await repo().acceptCorrection(owner.id, "not-a-uuid")).toBeNull();
      expect((await repo().findById(owner.id, id))?.correction?.accepted).toBe(
        false,
      );
    });
  });
});
