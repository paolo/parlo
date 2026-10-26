import { describe, expect, it } from "vitest";
import type { ProfileLanguage } from "../profile/types";
import { buildBundleGroup } from "./bundles";

const profile = (...langs: ProfileLanguage["lang"][]): ProfileLanguage[] =>
  langs.map((lang, position) => ({
    lang,
    region: "XX",
    level: position === 0 ? "native" : "intermediate",
    position,
  }));

describe("buildBundleGroup", () => {
  it("carries the ref, and only the user's languages in their order", async () => {
    // starter-001 was written in English.
    const group = await buildBundleGroup(
      "u1",
      "starter",
      "starter-001",
      profile("es", "en", "fr"),
    );

    expect(group).toMatchObject({
      userId: "u1",
      bundleRef: "starter:starter-001",
      notes: null,
      correction: null,
    });
    expect(group?.phrases).toEqual([
      { lang: "es", text: "Hola, ¿cómo estás?", isRoot: false },
      { lang: "en", text: "Hi, how are you?", isRoot: true },
      { lang: "fr", text: "Salut, comment ça va ?", isRoot: false },
    ]);
  });

  it("roots the group on the user's first language when the phrase's own is not theirs", async () => {
    const group = await buildBundleGroup(
      "u1",
      "starter",
      "starter-001",
      profile("es", "pt", "it"),
    );

    expect(group?.phrases.map((p) => [p.lang, p.isRoot])).toEqual([
      ["es", true],
      ["pt", false],
      ["it", false],
    ]);
  });

  it("returns null for an unknown bundle or phrase", async () => {
    const languages = profile("es", "en", "fr");
    expect(
      await buildBundleGroup("u1", "nope", "starter-001", languages),
    ).toBeNull();
    expect(
      await buildBundleGroup("u1", "starter", "starter-999", languages),
    ).toBeNull();
    expect(await buildBundleGroup("u1", "toString", "x", languages)).toBeNull();
  });
});
