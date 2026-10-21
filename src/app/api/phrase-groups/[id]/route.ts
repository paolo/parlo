import { z } from "zod";
import { getPhraseRepository } from "@/server/container";
import { jsonError, withSession } from "@/server/http/responses";
import { parseJson } from "@/server/http/validation";
import {
  CorrectionNotAcceptableError,
  PhrasebookFullError,
} from "@/server/phrases/types";

const bodySchema = z.union([
  z.object({ isFavorite: z.boolean() }).strict(),
  z.object({ acceptCorrection: z.literal(true) }).strict(),
]);

export const PATCH = withSession<{ id: string }>(
  async (req, { userId, params }) => {
    const parsed = await parseJson(req, bodySchema);
    if ("response" in parsed) return parsed.response;

    const repository = getPhraseRepository();
    try {
      const group =
        "acceptCorrection" in parsed.data
          ? await repository.acceptCorrection(userId, params.id)
          : await repository.setFavorite(
              userId,
              params.id,
              parsed.data.isFavorite,
            );
      if (!group) return jsonError(404, "not_found");
      return Response.json({ group });
    } catch (error) {
      if (error instanceof PhrasebookFullError) {
        return jsonError(409, "phrasebook_full", { limit: error.limit });
      }
      if (error instanceof CorrectionNotAcceptableError) {
        return jsonError(409, error.code);
      }
      throw error;
    }
  },
);

export const DELETE = withSession<{ id: string }>(
  async (_req, { userId, params }) => {
    const deleted = await getPhraseRepository().deleteGroup(userId, params.id);
    if (!deleted) return jsonError(404, "not_found");
    return new Response(null, { status: 204 });
  },
);
