import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "../db/client";
import * as schema from "../db/schema";
import { getEnv } from "../env";

function createAuth() {
  const env = getEnv();
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    // Dev and test convenience only: production signs in with Google, so no passwords are stored there.
    emailAndPassword: { enabled: process.env.NODE_ENV !== "production" },
    user: {
      additionalFields: {
        // Per-user override of DAILY_TRANSLATION_LIMIT. input: false keeps users from setting it at sign-up.
        dailyLimit: { type: "number", required: false, input: false },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

let auth: Auth | undefined;

/** Created lazily so importing this module (e.g. during `next build`) needs no secrets or DB. */
export function getAuth(): Auth {
  auth ??= createAuth();
  return auth;
}
