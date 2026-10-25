import { describe, expect, it } from "vitest";
import { roleFor } from "./roles";

describe("roleFor", () => {
  const profile = ["uk", "en", "fr"] as const;

  it("follows profile position, not the language", () => {
    expect(roleFor("uk", [...profile])).toBe("native");
    expect(roleFor("en", [...profile])).toBe("english");
    expect(roleFor("fr", [...profile])).toBe("french");
    expect(roleFor("fr", ["fr", "es", "en"])).toBe("native");
  });

  it("is undefined for a language outside the profile", () => {
    expect(roleFor("hi", [...profile])).toBeUndefined();
    expect(roleFor("es", [])).toBeUndefined();
  });
});
