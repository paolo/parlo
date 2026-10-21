import { describe, expect, it } from "vitest";
import { ApiError } from "./api";
import { errorMessage } from "./errors";

describe("errorMessage", () => {
  it("explains the daily limit with the reset time", () => {
    const message = errorMessage(
      new ApiError(429, {
        error: "rate_limited",
        reason: "daily",
        resetAt: "2026-10-11T00:00:00.000Z",
      }),
    );
    expect(message).toMatch(/daily limit/i);
  });

  it("asks to slow down on bursts, with seconds to wait", () => {
    const resetAt = new Date(Date.now() + 42_000).toISOString();
    expect(
      errorMessage(
        new ApiError(429, { error: "rate_limited", reason: "burst", resetAt }),
      ),
    ).toMatch(/4[12] s/);
  });

  it("maps known API errors to friendly text", () => {
    expect(
      errorMessage(
        new ApiError(422, {
          error: "unsupported_language",
          languages: ["es", "en", "fr"],
        }),
      ),
    ).toContain("Español, English, Français");
    expect(
      errorMessage(new ApiError(409, { error: "profile_incomplete" })),
    ).toBe("Pick your three languages first.");
    expect(
      errorMessage(new ApiError(409, { error: "phrasebook_full", limit: 100 })),
    ).toBe("Your phrasebook is full (100). Remove one to add another.");
    expect(errorMessage(new ApiError(409, { error: "already_accepted" }))).toBe(
      "That correction was already applied.",
    );
    expect(errorMessage(new ApiError(409, { error: "no_correction" }))).toBe(
      "There is no correction to apply.",
    );
    expect(
      errorMessage(new ApiError(502, { error: "translation_failed" })),
    ).toMatch(/try again/i);
    expect(errorMessage(new ApiError(401, { error: "unauthorized" }))).toMatch(
      /sign in/i,
    );
  });

  it("falls back to a generic message", () => {
    expect(errorMessage(new Error("boom"))).toMatch(/something went wrong/i);
    expect(errorMessage(new ApiError(500, null))).toMatch(
      /something went wrong/i,
    );
  });
});
