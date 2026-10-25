// What the model calls have cost, from the usage ledger. Reads DATABASE_URL from the env file you pass, so it can
// point at production: npm run usage:cost  (local)  or  npx tsx --env-file=.env.prod scripts/usage-cost.mts
// Prices are list prices in USD per million tokens (Haiku 5.5, prompts under 100K): update them if they change.
import { sql } from "drizzle-orm";
import { getDb, getPool } from "../src/server/db/client";
import { translationUsage } from "../src/server/db/schema";

const PRICE_PER_MILLION = { input: 0.1, output: 0.5 };

const rows = await getDb()
  .select({
    day: sql<string>`to_char(${translationUsage.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`,
    calls: sql<number>`count(*)`.mapWith(Number),
    measured: sql<number>`count(${translationUsage.inputTokens})`.mapWith(
      Number,
    ),
    input:
      sql<number>`coalesce(sum(${translationUsage.inputTokens}), 0)`.mapWith(
        Number,
      ),
    output:
      sql<number>`coalesce(sum(${translationUsage.outputTokens}), 0)`.mapWith(
        Number,
      ),
  })
  .from(translationUsage)
  .groupBy(sql`1`)
  .orderBy(sql`1 desc`)
  .limit(31);

let total = 0;
console.log("day         calls  measured  input tok  output tok     USD");
for (const r of rows) {
  const usd =
    (r.input * PRICE_PER_MILLION.input + r.output * PRICE_PER_MILLION.output) /
    1e6;
  total += usd;
  console.log(
    `${r.day}  ${String(r.calls).padStart(5)}  ${String(r.measured).padStart(8)}  ${String(r.input).padStart(9)}  ${String(r.output).padStart(10)}  ${usd.toFixed(4).padStart(6)}`,
  );
}
console.log(`last ${rows.length} days: $${total.toFixed(4)}`);
await getPool().end();
