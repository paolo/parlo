import { relations, sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { LANG_CODES } from "../../shared/languages";

export const LEVELS = [
  "native",
  "advanced",
  "intermediate",
  "beginner",
] as const;
export type Level = (typeof LEVELS)[number];

export const langEnum = pgEnum("lang", LANG_CODES);
export const levelEnum = pgEnum("level", LEVELS);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// --- Better Auth tables (fields match better-auth 1.7 getAuthTables output) ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  dailyLimit: integer("daily_limit"),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// --- Parlo tables ---

export const phraseGroup = pgTable(
  "phrase_group",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    isFavorite: boolean("is_favorite").notNull().default(false),
    notes: text("notes"),
    correctionText: text("correction_text"),
    correctionExplanation: text("correction_explanation"),
    correctionAccepted: boolean("correction_accepted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("phrase_group_user_created_idx").on(
      t.userId,
      t.createdAt.desc(),
      t.id.desc(),
    ),
  ],
);

export const phrase = pgTable(
  "phrase",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => phraseGroup.id, { onDelete: "cascade" }),
    lang: langEnum("lang").notNull(),
    text: text("text").notNull(),
    isRoot: boolean("is_root").notNull().default(false),
    correctedFrom: text("corrected_from"),
  },
  (t) => [
    uniqueIndex("phrase_group_lang_idx").on(t.groupId, t.lang),
    uniqueIndex("phrase_one_root_per_group_idx")
      .on(t.groupId)
      .where(sql`${t.isRoot}`),
  ],
);

export const languageLevel = pgTable(
  "language_level",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lang: langEnum("lang").notNull(),
    level: levelEnum("level").notNull(),
    // ISO 3166-1 alpha-2; null falls back to the language's default region.
    region: text("region"),
    // 0 = native language, 1 and 2 = learning languages.
    position: smallint("position").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.lang] }),
    uniqueIndex("language_level_user_position_idx").on(t.userId, t.position),
    check("language_level_position_range", sql`${t.position} between 0 and 2`),
  ],
);

export const translationUsage = pgTable(
  "translation_usage",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // What was spent on: see ACTION_COSTS in server/usage/costs.ts.
    action: text("action").notNull().default("translation"),
    // Allowance units this row used. Today's usage is the sum of these, not the number of rows.
    cost: integer("cost").notNull().default(1),
    // What the model provider billed for the call, so real spend can be added up. Null when not measured.
    model: text("model"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check("translation_usage_cost_positive", sql`${t.cost} > 0`),
    index("translation_usage_user_created_idx").on(t.userId, t.createdAt),
  ],
);

// --- Relations (for db.query ... with) ---

export const phraseGroupRelations = relations(phraseGroup, ({ many }) => ({
  phrases: many(phrase),
}));

export const phraseRelations = relations(phrase, ({ one }) => ({
  group: one(phraseGroup, {
    fields: [phrase.groupId],
    references: [phraseGroup.id],
  }),
}));
