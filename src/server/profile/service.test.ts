import { describe, expect, it } from "vitest";
import { buildProfile, isProfileComplete } from "./service";

describe("buildProfile", () => {
  it("makes the first language native and the others intermediate, by position", () => {
    const profile = buildProfile([
      { lang: "es", region: "BO" },
      { lang: "en" },
      { lang: "fr" },
    ]);

    expect(profile.map((l) => [l.position, l.lang, l.level])).toEqual([
      [0, "es", "native"],
      [1, "en", "intermediate"],
      [2, "fr", "intermediate"],
    ]);
  });

  it("fills a missing region with the language default", () => {
    const profile = buildProfile([
      { lang: "es" },
      { lang: "en" },
      { lang: "fr" },
    ]);

    expect(profile.map((l) => l.region)).toEqual(["ES", "GB", "FR"]);
  });

  it("keeps an explicit region", () => {
    const [native] = buildProfile([
      { lang: "es", region: "BO" },
      { lang: "en" },
      { lang: "fr" },
    ]);

    expect(native.region).toBe("BO");
  });
});

describe("isProfileComplete", () => {
  it("is true only for exactly three languages", () => {
    const three = buildProfile([
      { lang: "es" },
      { lang: "en" },
      { lang: "fr" },
    ]);

    expect(isProfileComplete(three)).toBe(true);
    expect(isProfileComplete(three.slice(0, 2))).toBe(false);
    expect(isProfileComplete([])).toBe(false);
  });
});
