import { describe, expect, it } from "vitest";
import { diffChars } from "./textDiff";

const join = (parts: ReturnType<typeof diffChars>, kinds: string[]) =>
  parts
    .filter((p) => kinds.includes(p.kind))
    .map((p) => p.text)
    .join("");

describe("diffChars", () => {
  it("rebuilds both texts and keeps what they share", () => {
    const parts = diffChars("que hora es", "¿Qué hora es?");

    expect(join(parts, ["same", "del"])).toBe("que hora es");
    expect(join(parts, ["same", "add"])).toBe("¿Qué hora es?");
    expect(join(parts, ["same"])).toBe("u hora es");
  });

  it("merges neighbouring parts of the same kind, deletions before additions", () => {
    expect(diffChars("hola amigo", "hola amiga")).toEqual([
      { kind: "same", text: "hola amig" },
      { kind: "del", text: "o" },
      { kind: "add", text: "a" },
    ]);
  });

  it("returns one same part for identical texts", () => {
    expect(diffChars("Bonjour", "Bonjour")).toEqual([
      { kind: "same", text: "Bonjour" },
    ]);
  });

  it("returns one add part when there was nothing before", () => {
    expect(diffChars("", "Hola")).toEqual([{ kind: "add", text: "Hola" }]);
  });

  it("never splits a letter from its accent or an emoji from its skin tone", () => {
    const parts = diffChars("cé", "cé");
    expect(parts).toEqual([
      { kind: "same", text: "c" },
      { kind: "del", text: "é" },
      { kind: "add", text: "é" },
    ]);

    const emoji = diffChars("ok 👍🏽", "ok 👍");
    expect(emoji).toEqual([
      { kind: "same", text: "ok " },
      { kind: "del", text: "👍🏽" },
      { kind: "add", text: "👍" },
    ]);
  });
});
