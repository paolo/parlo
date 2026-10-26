import { describe, expect, it } from "vitest";
import type { Bundle } from "../../shared/bundles/types";
import { LANG_CODES, type Lang } from "../../shared/languages";
import { bundleToGroups } from "./bundles";
import { buildCards } from "./session";

const text = (prefix: string) =>
  Object.fromEntries(LANG_CODES.map((l) => [l, `${prefix} ${l}`])) as Record<
    Lang,
    string
  >;

const bundle: Bundle = {
  id: "starter",
  name: "Starter",
  phrases: [
    { id: "s-1", topic: "greetings", source: "en", text: text("one") },
    { id: "s-2", topic: "greetings", source: "fr", text: text("two") },
  ],
};

describe("bundleToGroups", () => {
  it("makes one group per phrase with a bundle: id and all 13 languages in catalog order", () => {
    const groups = bundleToGroups(bundle);
    expect(groups.map((g) => g.id)).toEqual(["bundle:s-1", "bundle:s-2"]);
    expect(groups[0].phrases.map((p) => p.lang)).toEqual([...LANG_CODES]);
    expect(groups[0].phrases[0]).toMatchObject({
      text: "one es",
      isRoot: false,
      correctedFrom: null,
    });
    expect(groups[0]).toMatchObject({
      isFavorite: false,
      notes: null,
      correction: null,
    });
  });

  it("builds a card for every phrase in any practice language, skipping none", () => {
    const { cards, skipped } = buildCards(bundleToGroups(bundle), "ar", [
      "es",
      "en",
      "ar",
    ]);
    expect(cards).toHaveLength(2);
    expect(skipped).toBe(0);
    expect(cards[0].front.text).toBe("one ar");
  });
});
