// Live check against the real model (costs a fraction of a cent). Never run in CI.
// Usage: npm run smoke:haiku -- "me late the train" ["another phrase" ...]
import Anthropic from "@anthropic-ai/sdk";
import { buildProfile } from "../src/server/profile/service";
import { type Effort, HaikuTranslator } from "../src/server/translation/haiku";

const phrases = process.argv.slice(2);
if (phrases.length === 0) {
  console.error(
    'Usage: npm run smoke:haiku -- "a phrase" ["another phrase" ...]',
  );
  process.exit(1);
}

// SMOKE_EFFORT=medium npm run smoke:haiku -- "…" to compare effort levels.
const effort = (process.env.SMOKE_EFFORT ?? "low") as Effort;
const translator = new HaikuTranslator(new Anthropic(), effort);
console.log(`effort: ${effort}`);
const languages = buildProfile([
  { lang: "es", region: "BO" },
  { lang: "en" },
  { lang: "fr" },
]);

for (const text of phrases) {
  const started = performance.now();
  const result = await translator.translate({ text, languages });
  console.log(`\n» ${text}  (${Math.round(performance.now() - started)} ms)`);
  console.log(JSON.stringify(result, null, 2));
}
