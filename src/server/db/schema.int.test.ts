import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser, resetDb } from "@/test/db";
import { getDb } from "./client";
import { phrase, phraseGroup, user } from "./schema";

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
});
