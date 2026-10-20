import { z } from "zod";
import { getPhraseRepository } from "@/server/container";
import { jsonError, withSession } from "@/server/http/responses";
import { parseJson } from "@/server/http/validation";

const bodySchema = z.object({ isFavorite: z.boolean() });

export const PATCH = withSession<{ id: string }>(
  async (req, { userId, params }) => {
    const parsed = await parseJson(req, bodySchema);
    if ("response" in parsed) return parsed.response;

    const group = await getPhraseRepository().setFavorite(
      userId,
      params.id,
      parsed.data.isFavorite,
    );
    if (!group) return jsonError(404, "not_found");
    return Response.json({ group });
  },
);
