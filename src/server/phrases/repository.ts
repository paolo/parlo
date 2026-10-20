import { and, desc, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { type Lang, phrase, phraseGroup } from "../db/schema";
import type {
  NewPhraseGroup,
  PhraseDTO,
  PhraseGroupDTO,
  PhraseRepository,
} from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type GroupRow = typeof phraseGroup.$inferSelect & {
  phrases: (typeof phrase.$inferSelect)[];
};

export function toDTO(row: GroupRow): PhraseGroupDTO {
  const phrases = Object.fromEntries(
    row.phrases.map((p) => [
      p.lang,
      {
        lang: p.lang,
        text: p.text,
        isRoot: p.isRoot,
        correctedFrom: p.correctedFrom,
      } satisfies PhraseDTO,
    ]),
  ) as Record<Lang, PhraseDTO>;
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

  async listFavorites(userId: string): Promise<PhraseGroupDTO[]> {
    const rows = await this.db.query.phraseGroup.findMany({
      where: and(
        eq(phraseGroup.userId, userId),
        eq(phraseGroup.isFavorite, true),
      ),
      orderBy: [desc(phraseGroup.createdAt), desc(phraseGroup.id)],
      with: { phrases: true },
    });
    return rows.map(toDTO);
  }
}
