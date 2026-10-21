import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser, resetDb } from "@/test/db";
import { getDb } from "./client";
import { languageLevel, phrase, phraseGroup, user } from "./schema";

describe("database schema", () => {
  beforeEach(resetDb);

  it("allows exactly one root phrase per group", async () => {
    const db = getDb();
    const owner = await createTestUser();
    const [group] = await db
      .insert(phraseGroup)
      .values({ userId: owner.id })
      .returning();

    await db
      .insert(phrase)
      .values({ groupId: group.id, lang: "es", text: "hola", isRoot: true });
    await db
      .insert(phrase)
      .values({ groupId: group.id, lang: "en", text: "hello", isRoot: false });

    await expect(
      db
        .insert(phrase)
        .values({ groupId: group.id, lang: "fr", text: "salut", isRoot: true }),
    ).rejects.toThrow();
  });

  it("allows one phrase per language in a group", async () => {
    const db = getDb();
    const owner = await createTestUser();
    const [group] = await db
      .insert(phraseGroup)
      .values({ userId: owner.id })
      .returning();

    await db
      .insert(phrase)
      .values({ groupId: group.id, lang: "es", text: "hola", isRoot: true });
    await expect(
      db
        .insert(phrase)
        .values({ groupId: group.id, lang: "es", text: "buenas" }),
    ).rejects.toThrow();
  });

  it("deletes a user's groups and phrases with the user", async () => {
    const db = getDb();
    const owner = await createTestUser();
    const [group] = await db
      .insert(phraseGroup)
      .values({ userId: owner.id })
      .returning();
    await db
      .insert(phrase)
      .values({ groupId: group.id, lang: "es", text: "hola", isRoot: true });

    await db.delete(user).where(eq(user.id, owner.id));

    expect(await db.select().from(phraseGroup)).toHaveLength(0);
    expect(await db.select().from(phrase)).toHaveLength(0);
  });
  it("stores phrases in the newer languages", async () => {
    const db = getDb();
    const owner = await createTestUser();
    const [group] = await db
      .insert(phraseGroup)
      .values({ userId: owner.id })
      .returning();

    await db
      .insert(phrase)
      .values({ groupId: group.id, lang: "pt", text: "oi", isRoot: true });

    expect(await db.select().from(phrase)).toHaveLength(1);
  });

  describe("language profile", () => {
    it("round-trips a region", async () => {
      const db = getDb();
      const owner = await createTestUser();
      await db.insert(languageLevel).values({
        userId: owner.id,
        lang: "es",
        level: "native",
        region: "BO",
        position: 0,
      });

      const [row] = await db.select().from(languageLevel);
      expect(row).toMatchObject({ lang: "es", region: "BO", position: 0 });
    });

    it("rejects two languages at the same position", async () => {
      const db = getDb();
      const owner = await createTestUser();
      await db.insert(languageLevel).values({
        userId: owner.id,
        lang: "es",
        level: "native",
        position: 0,
      });

      await expect(
        db.insert(languageLevel).values({
          userId: owner.id,
          lang: "en",
          level: "intermediate",
          position: 0,
        }),
      ).rejects.toThrow();
    });

    it("rejects a position outside 0 to 2", async () => {
      const db = getDb();
      const owner = await createTestUser();

      await expect(
        db.insert(languageLevel).values({
          userId: owner.id,
          lang: "es",
          level: "native",
          position: 3,
        }),
      ).rejects.toThrow();
    });
  });
});
