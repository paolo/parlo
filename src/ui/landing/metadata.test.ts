import { describe, expect, it } from "vitest";
import { landingMetadata } from "./metadata";

describe("landingMetadata", () => {
  const metadata = landingMetadata("https://parlo.fun/");

  it("describes the idea, not just the name", () => {
    expect(metadata.description).toBe(
      "Understand and use colloquial phrases across your three languages.",
    );
    expect(String(metadata.title)).toMatch(/three languages/i);
    expect(String(metadata.title)).toMatch(/^parlo/);
  });

  it("gives chat apps a large preview card with the same title and description", () => {
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      title: metadata.title,
      description: metadata.description,
    });
  });

  it("resolves relative URLs against the public origin", () => {
    expect(String(metadata.metadataBase)).toBe("https://parlo.fun/");
  });

  it("works without an origin, for builds that do not know it", () => {
    expect(landingMetadata(undefined).metadataBase).toBeUndefined();
  });
});
