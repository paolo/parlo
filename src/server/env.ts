import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  DAILY_TRANSLATION_LIMIT: z.coerce.number().int().positive().default(50),
  BURST_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
    throw new Error(`Invalid environment variables:\n${problems.join("\n")}`);
  }
  return result.data;
}

let cached: Env | undefined;

/** Parsed lazily so `next build` does not need runtime secrets. */
export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
