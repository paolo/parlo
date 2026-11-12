import { and, asc, count, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { phrase, phraseGroup } from "../db/schema";
import { decodeCursor, encodeCursor } from "./cursor";
import { orderPhraseDTOs } from "./service";
import type {
  NewBundleGroup,
  NewPhraseGroup,
  PhraseDTO,
  PhraseGroupDTO,
  PhraseLimits,
  PhrasePage,
  PhraseRepository,
} from "./types";
import { CorrectionNotAcceptableError, PhrasebookFullError } from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type GroupRow = typeof phraseGroup.$inferSelect & {
  phrases: (typeof phrase.$inferSelect)[];
};

export function toDTO(row: GroupRow): PhraseGroupDTO {
  const phrases = orderPhraseDTOs(
    row.phrases.map(
      (p): PhraseDTO => ({
        lang: p.lang,
        text: p.text,
        isRoot: p.isRoot,
        correctedFrom: p.correctedFrom,
      }),
    ),
  );
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    isFavorite: row.isFavorite,
    bundleRef: row.bundleRef,
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
  constructor(
    private readonly db: Db,
    private readonly limits: PhraseLimits,
  ) {}

  async insertGroup(group: NewPhraseGroup): Promise<PhraseGroupDTO> {
    return this.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(phraseGroup)
        .values({
          id: group.id,
          createdAt: group.createdAt,
          userId: group.userId,
          notes: group.notes,
          correctionText: group.correction?.text ?? null,
          correctionExplanation: group.correction?.explanation ?? null,
          correctionAccepted: group.correction?.applied ?? false,
        })
        .returning();
      const phrases = await tx
        .insert(phrase)
        .values(
          group.phrases.map((p) => ({
            ...p,
            correctedFrom: p.correctedFrom ?? null,
            groupId: inserted.id,
          })),
        )
        .returning();
      return toDTO({ ...inserted, phrases });
    });
  }

  async pruneHistory(userId: string, keepId: string): Promise<void> {
    await this.db.transaction((tx) => this.pruneHistoryIn(tx, userId, keepId));
  }

  async favoriteBundleGroup(group: NewBundleGroup): Promise<PhraseGroupDTO> {
    const existing = await this.db.query.phraseGroup.findFirst({
      where: and(
        eq(phraseGroup.userId, group.userId),
        eq(phraseGroup.bundleRef, group.bundleRef),
      ),
      columns: { id: true },
    });
    if (existing) {
      const updated = await this.setFavorite(group.userId, existing.id, true);
      if (updated) return updated;
    }
    await this.assertRoomForNewFavorite(group.userId);
    try {
      return await this.db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(phraseGroup)
          .values({
            userId: group.userId,
            bundleRef: group.bundleRef,
            isFavorite: true,
            notes: group.notes,
          })
          .returning();
        const phrases = await tx
          .insert(phrase)
          .values(group.phrases.map((p) => ({ ...p, groupId: inserted.id })))
          .returning();
        await this.pruneHistoryIn(tx, group.userId, inserted.id);
        return toDTO({ ...inserted, phrases });
      });
    } catch (error) {
      // Two taps at once: the other request created it first, so favorite that one.
      const raced = await this.db.query.phraseGroup.findFirst({
        where: and(
          eq(phraseGroup.userId, group.userId),
          eq(phraseGroup.bundleRef, group.bundleRef),
        ),
        columns: { id: true },
      });
      const updated = raced
        ? await this.setFavorite(group.userId, raced.id, true)
        : null;
      if (updated) return updated;
      throw error;
    }
  }

  async deleteBundleGroup(userId: string, bundleRef: string): Promise<boolean> {
    const deleted = await this.db
      .delete(phraseGroup)
      .where(
        and(
          eq(phraseGroup.userId, userId),
          eq(phraseGroup.bundleRef, bundleRef),
        ),
      )
      .returning({ id: phraseGroup.id });
    return deleted.length > 0;
  }

  /**
   * Keeps at most `historyLimit` groups by deleting the oldest unstarred ones. Starred groups and the
   * group just saved are never deleted, so a user full of starred groups simply stays over the limit.
   */
  private async pruneHistoryIn(
    tx: Pick<Db, "select" | "delete">,
    userId: string,
    justSavedId: string,
  ) {
    const [{ total }] = await tx
      .select({ total: count() })
      .from(phraseGroup)
      .where(eq(phraseGroup.userId, userId));
    const excess = total - this.limits.historyLimit;
    if (excess <= 0) return;
    const oldest = await tx
      .select({ id: phraseGroup.id })
      .from(phraseGroup)
      .where(
        and(
          eq(phraseGroup.userId, userId),
          eq(phraseGroup.isFavorite, false),
          ne(phraseGroup.id, justSavedId),
        ),
      )
      .orderBy(asc(phraseGroup.createdAt), asc(phraseGroup.id))
      .limit(excess);
    if (oldest.length === 0) return;
    await tx.delete(phraseGroup).where(
      inArray(
        phraseGroup.id,
        oldest.map((g) => g.id),
      ),
    );
  }

  async setCorrectionApplied(
    userId: string,
    id: string,
    applied: boolean,
  ): Promise<PhraseGroupDTO | null> {
    if (!UUID.test(id)) return null;
    const found = await this.db.transaction(async (tx) => {
      // The row lock makes a second request wait for the first, then see the state it left.
      const [group] = await tx
        .select()
        .from(phraseGroup)
        .where(and(eq(phraseGroup.id, id), eq(phraseGroup.userId, userId)))
        .for("update");
      if (!group) return false;
      if (!group.correctionText || !group.correctionExplanation) {
        throw new CorrectionNotAcceptableError("no_correction");
      }
      if (group.correctionAccepted === applied) return true;
      const [root] = await tx
        .select()
        .from(phrase)
        .where(and(eq(phrase.groupId, id), eq(phrase.isRoot, true)));
      await tx
        .update(phrase)
        .set(
          applied
            ? { text: group.correctionText, correctedFrom: root.text }
            : { text: root.correctedFrom ?? root.text, correctedFrom: null },
        )
        .where(eq(phrase.id, root.id));
      await tx
        .update(phraseGroup)
        .set({ correctionAccepted: applied })
        .where(eq(phraseGroup.id, id));
      return true;
    });
    return found ? this.findById(userId, id) : null;
  }

  async deleteGroup(userId: string, id: string): Promise<boolean> {
    if (!UUID.test(id)) return false;
    const deleted = await this.db
      .delete(phraseGroup)
      .where(and(eq(phraseGroup.id, id), eq(phraseGroup.userId, userId)))
      .returning({ id: phraseGroup.id });
    return deleted.length > 0;
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
    if (isFavorite) await this.assertRoomToStar(userId, id);
    const updated = await this.db
      .update(phraseGroup)
      .set({ isFavorite })
      .where(and(eq(phraseGroup.id, id), eq(phraseGroup.userId, userId)))
      .returning({ id: phraseGroup.id });
    return updated.length > 0 ? this.findById(userId, id) : null;
  }

  private async assertRoomForNewFavorite(userId: string) {
    const [{ starred }] = await this.db
      .select({ starred: count() })
      .from(phraseGroup)
      .where(
        and(eq(phraseGroup.userId, userId), eq(phraseGroup.isFavorite, true)),
      );
    if (starred >= this.limits.phrasebookLimit) {
      throw new PhrasebookFullError(this.limits.phrasebookLimit);
    }
  }

  // Best effort: two parallel stars could overshoot the cap by one, which is harmless at this size.
  private async assertRoomToStar(userId: string, id: string) {
    const group = await this.db.query.phraseGroup.findFirst({
      where: and(eq(phraseGroup.id, id), eq(phraseGroup.userId, userId)),
      columns: { isFavorite: true },
    });
    if (!group || group.isFavorite) return;
    const [{ starred }] = await this.db
      .select({ starred: count() })
      .from(phraseGroup)
      .where(
        and(eq(phraseGroup.userId, userId), eq(phraseGroup.isFavorite, true)),
      );
    if (starred >= this.limits.phrasebookLimit) {
      throw new PhrasebookFullError(this.limits.phrasebookLimit);
    }
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
