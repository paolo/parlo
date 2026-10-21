import { beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/server/db/client";
import { languageLevel } from "@/server/db/schema";
import { createTestUser, resetDb } from "@/test/db";
import { DrizzleProfileRepository } from "./repository";
import { buildProfile } from "./service";

const esEnFr = buildProfile([
  { lang: "es", region: "BO" },
  { lang: "en" },
  { lang: "fr" },
]);
const ptEnFr = buildProfile([
  { lang: "pt", region: "BR" },
  { lang: "en" },
  { lang: "fr" },
]);

describe("DrizzleProfileRepository", () => {
  beforeEach(resetDb);
  const repo = () => new DrizzleProfileRepository(getDb());

  it("returns an empty profile for a user with no rows", async () => {
    const owner = await createTestUser();

    expect(await repo().getProfile(owner.id)).toEqual([]);
  });

  it("round-trips a profile ordered by position", async () => {
    const owner = await createTestUser();
    await repo().replaceProfile(owner.id, esEnFr);

    expect(await repo().getProfile(owner.id)).toEqual(esEnFr);
  });

  it("replaces the whole set on a second write", async () => {
    const owner = await createTestUser();
    await repo().replaceProfile(owner.id, esEnFr);
    await repo().replaceProfile(owner.id, ptEnFr);

    expect(await repo().getProfile(owner.id)).toEqual(ptEnFr);
  });

  it("keeps the old profile when the replacement fails", async () => {
    const owner = await createTestUser();
    await repo().replaceProfile(owner.id, esEnFr);
    const clashing = ptEnFr.map((l) => ({ ...l, position: 0 }));

    await expect(repo().replaceProfile(owner.id, clashing)).rejects.toThrow();

    expect(await repo().getProfile(owner.id)).toEqual(esEnFr);
  });

  it("fills the default region when the stored one is null", async () => {
    const owner = await createTestUser();
    await getDb().insert(languageLevel).values({
      userId: owner.id,
      lang: "en",
      level: "native",
      region: null,
      position: 0,
    });

    const [only] = await repo().getProfile(owner.id);

    expect(only.region).toBe("GB");
  });

  it("keeps profiles of different users apart", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    await repo().replaceProfile(a.id, esEnFr);
    await repo().replaceProfile(b.id, ptEnFr);

    expect(await repo().getProfile(a.id)).toEqual(esEnFr);
  });
});
