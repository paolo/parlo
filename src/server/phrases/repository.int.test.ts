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
      phrases: {
        es: { lang: "es", text: "me tarde", isRoot: true, correctedFrom: null },
        en: { lang: "en", text: "I was late", isRoot: false },
        fr: { lang: "fr", text: "J'étais en retard", isRoot: false },
      },
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
});
