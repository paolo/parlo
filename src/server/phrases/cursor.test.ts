import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "./cursor";

const position = {
  createdAt: "2026-10-21 13:00:00.000123+00",
  id: "6f1c1f0e-2b7a-4b53-9a43-0d5e3a1f2c11",
};

describe("cursor", () => {
  it("round-trips a position, keeping microseconds", () => {
    expect(decodeCursor(encodeCursor(position))).toEqual(position);
  });

  it("is safe to put in a URL", () => {
    expect(encodeCursor(position)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it.each([
    ["not base64 JSON", "garbage"],
    ["empty", ""],
    [
      "JSON of the wrong shape",
      Buffer.from(JSON.stringify({ a: 1 })).toString("base64url"),
    ],
    [
      "a timestamp that is not a timestamp",
      encodeCursor({ ...position, createdAt: "yesterday" }),
    ],
    ["an id that is not a uuid", encodeCursor({ ...position, id: "g1" })],
  ])("rejects %s", (_name, cursor) => {
    expect(decodeCursor(cursor)).toBeNull();
  });
});
