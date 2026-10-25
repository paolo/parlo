import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "../ui/contrast";

const AA = 4.5;
const css = readFileSync(join(__dirname, "tokens.css"), "utf8");

/** The `--parlo-*: #hex` declarations of the block that starts with `selector`. */
function colors(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf("\n}", start));
  return Object.fromEntries(
    [...block.matchAll(/(--parlo-[\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [
      m[1],
      m[2],
    ]),
  );
}

const dark = colors(":root");
const light = {
  ...dark,
  ...colors(':root[data-mantine-color-scheme="light"]'),
};

const ROLES = ["native", "english", "french"] as const;

describe.each([
  ["dark", dark],
  ["light", light],
])("%s tokens", (_scheme, t) => {
  const surfaces = [
    "--parlo-ground",
    "--parlo-surface",
    "--parlo-surface-raised",
    "--parlo-surface-chip",
  ];

  it.each(
    surfaces.flatMap((surface) =>
      [
        "--parlo-text",
        "--parlo-text-soft",
        "--parlo-text-muted",
        "--parlo-text-placeholder",
        "--parlo-accent",
      ].map((text) => [text, surface]),
    ),
  )("%s on %s meets AA", (text, surface) => {
    // Muted and placeholder text never sit on the chip, which only holds labels in the full text color.
    if (surface === "--parlo-surface-chip" && /placeholder/.test(text)) return;
    expect(contrastRatio(t[text], t[surface])).toBeGreaterThanOrEqual(AA);
  });

  // Graphics need 3:1 (WCAG 1.4.11), not the 4.5:1 of text.
  it.each([
    "--parlo-meter-low",
    "--parlo-meter-out",
  ])("draws the %s ring visibly on the ground", (meter) => {
    expect(contrastRatio(t[meter], t["--parlo-ground"])).toBeGreaterThanOrEqual(
      3,
    );
  });

  it.each(ROLES)("puts dark text and the ink on the %s card", (role) => {
    expect(
      contrastRatio(t["--parlo-on-accent"], t[`--parlo-${role}`]),
    ).toBeGreaterThanOrEqual(AA);
    expect(
      contrastRatio(t[`--parlo-${role}-ink`], t[`--parlo-${role}`]),
    ).toBeGreaterThanOrEqual(AA);
  });

  it.each(ROLES)("reads the %s strong color on the ground", (role) => {
    expect(
      contrastRatio(t[`--parlo-${role}-strong`], t["--parlo-ground"]),
    ).toBeGreaterThanOrEqual(AA);
  });

  it("reads the primary pill label", () => {
    expect(
      contrastRatio(t["--parlo-ground"], t["--parlo-text"]),
    ).toBeGreaterThanOrEqual(AA);
  });
});

describe("light scheme", () => {
  it("keeps the role colors identical to dark, so cards look the same", () => {
    for (const role of ROLES) {
      expect(light[`--parlo-${role}`]).toBe(dark[`--parlo-${role}`]);
    }
  });
});
