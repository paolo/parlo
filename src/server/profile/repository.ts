import { asc, eq } from "drizzle-orm";
import { LANGUAGES } from "../../shared/languages";
import type { Db } from "../db/client";
import { languageLevel } from "../db/schema";
import type { ProfileLanguage, ProfileRepository } from "./types";

export class DrizzleProfileRepository implements ProfileRepository {
  constructor(private readonly db: Db) {}

  async getProfile(userId: string): Promise<ProfileLanguage[]> {
    const rows = await this.db
      .select()
      .from(languageLevel)
      .where(eq(languageLevel.userId, userId))
      .orderBy(asc(languageLevel.position));
    return rows.map((row) => ({
      lang: row.lang,
      region: row.region ?? LANGUAGES[row.lang].defaultRegion,
      level: row.level,
      position: row.position,
    }));
  }

  async replaceProfile(
    userId: string,
    languages: ProfileLanguage[],
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(languageLevel).where(eq(languageLevel.userId, userId));
      await tx
        .insert(languageLevel)
        .values(languages.map((language) => ({ ...language, userId })));
    });
  }
}
