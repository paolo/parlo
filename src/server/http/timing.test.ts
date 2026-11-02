import { describe, expect, it } from "vitest";
import { ServerTimer } from "./timing";

describe("ServerTimer", () => {
  it("returns what the step returns and lists each step in order", async () => {
    const timer = new ServerTimer();

    expect(await timer.time("profile", async () => 42)).toBe(42);
    await timer.time("model", async () => undefined);

    expect(timer.header()).toMatch(/^profile;dur=\d+\.\d, model;dur=\d+\.\d$/);
  });

  it("still records a step that throws, and rethrows", async () => {
    const timer = new ServerTimer();

    await expect(
      timer.time("model", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(timer.header()).toMatch(/^model;dur=/);
  });
});
