import { and, desc, eq, sql } from "drizzle-orm";
import { LANG_CODES } from "../../shared/languages";
import type { Db } from "../db/client";
import { phrase, phraseGroup } from "../db/schema";
import { decodeCursor, encodeCursor } from "./cursor";
import type {
  NewPhraseGroup,
  PhraseDTO,
  PhraseGroupDTO,
  PhrasePage,
  PhraseRepository,
} from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type GroupRow = typeof phraseGroup.$inferSelect & {
  phrases: (typeof phrase.$inferSelect)[];
};

export function toDTO(row: GroupRow): PhraseGroupDTO {
  const phrases = row.phrases
    .map(
      (p): PhraseDTO => ({
        lang: p.lang,
        text: p.text,
        isRoot: p.isRoot,
        correctedFrom: p.correctedFrom,
      }),
    )
    .sort(
      (a, b) =>
        Number(b.isRoot) - Number(a.isRoot) ||
        LANG_CODES.indexOf(a.lang) - LANG_CODES.indexOf(b.lang),
    );
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    isFavorite: row.isFavorite,
    notes: row.notes,
    correction:
      row.correctionText && row.correctionExplanation
        ? {
            text: row.correctionText,
            explanation: row.correctionExplanation,
            accepted: row.correctionAccepted,
          }
        : null,
    phrases,
  };
}

export class DrizzlePhraseRepository implements PhraseRepository {
  constructor(private readonly db: Db) {}

  async insertGroup(group: NewPhraseGroup): Promise<PhraseGroupDTO> {
    return this.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(phraseGroup)
        .values({
          userId: group.userId,
          notes: group.notes,
          correctionText: group.correction?.text ?? null,
          correctionExplanation: group.correction?.explanation ?? null,
        })
        .returning();
      const phrases = await tx
        .insert(phrase)
        .values(group.phrases.map((p) => ({ ...p, groupId: inserted.id })))
        .returning();
      return toDTO({ ...inserted, phrases });
    });
  }

  async findById(userId: string, id: string): Promise<PhraseGroupDTO | null> {
    if (!UUID.test(id)) return null;
    const row = await this.db.query.phraseGroup.findFirst({
      where: and(eq(phraseGroup.id, id), eq(phraseGroup.userId, userId)),
      with: { phrases: true },
    });
    return row ? toDTO(row) : null;
  }

  async setFavorite(
    userId: string,
    id: string,
    isFavorite: boolean,
  ): Promise<PhraseGroupDTO | null> {
    if (!UUID.test(id)) return null;
    const updated = await this.db
      .update(phraseGroup)
      .set({ isFavorite })
      .where(and(eq(phraseGroup.id, id), eq(phraseGroup.userId, userId)))
      .returning({ id: phraseGroup.id });
    return updated.length > 0 ? this.findById(userId, id) : null;
  }

  async listGroups(
    userId: string,
    {
      favorite = false,
      limit,
      cursor,
    }: { favorite?: boolean; limit: number; cursor?: string },
  ): Promise<PhrasePage> {
    const position = cursor ? decodeCursor(cursor) : null;
    const rows = await this.db.query.phraseGroup.findMany({
      where: and(
        eq(phraseGroup.userId, userId),
        favorite ? eq(phraseGroup.isFavorite, true) : undefined,
        position
          ? sql`(${phraseGroup.createdAt}, ${phraseGroup.id}) < (${position.createdAt}::timestamptz, ${position.id}::uuid)`
          : undefined,
      ),
      orderBy: [desc(phraseGroup.createdAt), desc(phraseGroup.id)],
      limit: limit + 1,
      with: { phrases: true },
      extras: {
        createdAtRaw: sql<string>`${phraseGroup.createdAt}::text`.as(
          "created_at_raw",
        ),
      },
    });
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page.map(toDTO),
      nextCursor:
        rows.length > limit && last
          ? encodeCursor({ createdAt: last.createdAtRaw, id: last.id })
          : null,
    };
  }
}
