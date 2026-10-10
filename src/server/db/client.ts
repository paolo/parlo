import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getEnv } from "../env";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

// Cached on globalThis so dev hot reloads reuse one pool instead of leaking connections.
const globalForDb = globalThis as unknown as { parloPool?: Pool; parloDb?: Db };

export function getPool(): Pool {
  globalForDb.parloPool ??= new Pool({
    connectionString: getEnv().DATABASE_URL,
    max: 5,
  });
  return globalForDb.parloPool;
}

export function getDb(): Db {
  globalForDb.parloDb ??= drizzle(getPool(), { schema });
  return globalForDb.parloDb;
}
