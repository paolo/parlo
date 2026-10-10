// Live check against the real model (costs a fraction of a cent). Never run in CI.
// Usage: npm run smoke:haiku -- "me late the train" ["another phrase" ...]
import Anthropic from "@anthropic-ai/sdk";
import { HaikuTranslator } from "../src/server/translation/haiku";

const phrases = process.argv.slice(2);
if (phrases.length === 0) {
  console.error(
    'Usage: npm run smoke:haiku -- "a phrase" ["another phrase" ...]',
  );
  process.exit(1);
}

const translator = new HaikuTranslator(new Anthropic());
const levels = { es: "native", en: "advanced", fr: "intermediate" } as const;

for (const text of phrases) {
  const started = performance.now();
  const result = await translator.translate({ text, levels });
  console.log(`\n» ${text}  (${Math.round(performance.now() - started)} ms)`);
  console.log(JSON.stringify(result, null, 2));
}
