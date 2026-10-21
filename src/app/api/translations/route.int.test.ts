import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/server/db/client";
import { languageLevel } from "@/server/db/schema";
import { DrizzleProfileRepository } from "@/server/profile/repository";
import { buildProfile } from "@/server/profile/service";
import { FakeTranslator } from "@/server/translation/fake";
import { createTestUser, resetDb } from "@/test/db";
import { POST } from "./route";

const session = vi.hoisted(() => ({ userId: "" }));
vi.mock("@/server/auth/session", () => ({ getSession: async () => session }));

const translator = new FakeTranslator({
  detectedLang: "es",
  correction: null,
  translations: [
    { lang: "es", text: "Estoy harto de esperar" },
    { lang: "en", text: "I'm fed up with waiting" },
    { lang: "fr", text: "J'en ai marre d'attendre" },
  ],
  notes: "Expresión coloquial.",
});
// Real limiter and repository; only the model is faked.
vi.mock("@/server/container", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/container")>()),
  getTranslator: () => translator,
}));

const post = (text: string) =>
  POST(
    new Request("http://test/api/translations", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
    { params: Promise.resolve({}) },
  );

describe("POST /api/translations (integration)", () => {
  beforeEach(async () => {
    await resetDb();
    session.userId = (await createTestUser()).id;
    await new DrizzleProfileRepository(getDb()).replaceProfile(
      session.userId,
      buildProfile([{ lang: "es" }, { lang: "en" }, { lang: "fr" }]),
    );
  });

  it("persists one group, three phrases and one usage row", async () => {
    const res = await post("Estoy hasta las narices de esperar");
    expect(res.status).toBe(201);
    const { group } = await res.json();

    const db = getDb();
    const groups = await db.query.phraseGroup.findMany({
      with: { phrases: true },
    });
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      id: group.id,
      userId: session.userId,
      notes: "Expresión coloquial.",
    });
    expect(groups[0].phrases).toHaveLength(3);
    expect(groups[0].phrases.find((p) => p.isRoot)).toMatchObject({
      lang: "es",
      text: "Estoy hasta las narices de esperar",
    });
    expect(await db.query.translationUsage.findMany()).toHaveLength(1);
  });

  it("asks a user without a profile to pick their languages and stores nothing", async () => {
    await getDb().delete(languageLevel);

    const res = await post("hola");

    expect(res.status).toBe(409);
    expect(await getDb().query.phraseGroup.findMany()).toHaveLength(0);
    expect(await getDb().query.translationUsage.findMany()).toHaveLength(0);
  });
});
