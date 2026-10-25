// Downloads country flag SVGs from HatScripts/circle-flags (MIT) into scripts/.flags for review.
// Review them, then move the ones you want into the app's images folder.
// Usage: npm run flags:download
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// ISO 3166-1 alpha-2, lowercase. Edit freely. Seeded from the regions in src/shared/languages.ts.
// The repo also has subdivisions ("es-ct"), historical and special flags: see its flags/ folder.
const FLAGS = [
  "af",
  "ao",
  "ar",
  "au",
  "be",
  "bo",
  "br",
  "by",
  "ca",
  "cd",
  "ch",
  "ci",
  "cl",
  "cn",
  "co",
  "cr",
  "cu",
  "do",
  "dz",
  "ec",
  "eg",
  "es",
  "fr",
  "gb",
  "gt",
  "hn",
  "ht",
  "ie",
  "in",
  "iq",
  "ir",
  "it",
  "jm",
  "jo",
  "kz",
  "lb",
  "ma",
  "mx",
  "mz",
  "ng",
  "ni",
  "pa",
  "pe",
  "ph",
  "pk",
  "pr",
  "pt",
  "py",
  "ru",
  "sa",
  "sd",
  "sg",
  "sn",
  "sv",
  "sy",
  "tw",
  "ua",
  "us",
  "uy",
  "ve",
  "za",
];

const BASE_URL = "https://hatscripts.github.io/circle-flags/flags";
const OUT_DIR = join(import.meta.dirname, ".flags");

await mkdir(OUT_DIR, { recursive: true });

const failed: string[] = [];
await Promise.all(
  [...new Set(FLAGS)].map(async (code) => {
    const response = await fetch(`${BASE_URL}/${code}.svg`);
    if (!response.ok) {
      failed.push(`${code} (HTTP ${response.status})`);
      return;
    }
    await writeFile(join(OUT_DIR, `${code}.svg`), await response.text());
  }),
);

console.log(`Saved ${new Set(FLAGS).size - failed.length} flags to ${OUT_DIR}`);
if (failed.length > 0) {
  console.error(`Failed: ${failed.join(", ")}`);
  process.exit(1);
}
