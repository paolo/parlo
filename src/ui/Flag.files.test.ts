import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LANGUAGES } from "../shared/languages";

describe("public/flags", () => {
  it("has an svg for every region a language offers", () => {
    const regions = new Set(
      Object.values(LANGUAGES).flatMap((language) => language.regions),
    );

    const missing = [...regions].filter(
      (region) =>
        !existsSync(
          join(process.cwd(), "public/flags", `${region.toLowerCase()}.svg`),
        ),
    );

    expect(missing).toEqual([]);
  });
});
