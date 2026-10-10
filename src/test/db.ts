import { sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { user } from "@/server/db/schema";

/** Empties every table between integration tests. Users cascade to everything else. */
export async function resetDb() {
  await getDb().execute(
    sql`truncate table "user", "verification" restart identity cascade`,
  );
}

let counter = 0;

export async function createTestUser(
  overrides: Partial<typeof user.$inferInsert> = {},
) {
  counter += 1;
  const [created] = await getDb()
    .insert(user)
    .values({
      id: `user-${counter}-${Date.now()}`,
      name: "Test User",
      email: `user${counter}-${Date.now()}@test.dev`,
      ...overrides,
    })
    .returning();
  return created;
}
