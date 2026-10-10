import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

// Runs once before the integration suite: bring the test database to the latest schema.
export default async function setup() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.endsWith("/parlo_test")) {
    throw new Error(`Refusing to migrate a non-test database: ${url}`);
  }
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle(pool), {
      migrationsFolder: "src/server/db/migrations",
    });
  } finally {
    await pool.end();
  }
}
