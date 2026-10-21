import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/server/db/client";
import { createTestUser, resetDb } from "@/test/db";
import { DrizzlePhraseRepository } from "./repository";
import type { NewPhraseGroup } from "./types";

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
  const repo = () => new DrizzlePhraseRepository(getDb());

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
});
