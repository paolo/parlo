import { describe, expect, it } from "vitest";
import Image, { alt, contentType, size } from "./opengraph-image";

describe("landing preview image", () => {
  it("is a 1200x630 PNG with alt text", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
    expect(alt).toMatch(/say it like a local/i);
    expect(alt).toMatch(/^parlo/);
  });

  it("renders to PNG bytes", async () => {
    const response = await Image();
    expect(response.headers.get("content-type")).toBe("image/png");
    const bytes = new Uint8Array(await response.arrayBuffer());
    // PNG signature
    expect([...bytes.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    expect(bytes.length).toBeGreaterThan(5000);
  });
});
