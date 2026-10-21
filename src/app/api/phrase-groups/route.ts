import { z } from "zod";
import { getPhraseRepository } from "@/server/container";
import { getEnv } from "@/server/env";
import { withSession } from "@/server/http/responses";
import { parseQuery } from "@/server/http/validation";
import { decodeCursor } from "@/server/phrases/cursor";

const querySchema = z.object({
  favorite: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z
    .string()
    .refine((value) => decodeCursor(value) !== null, "Invalid cursor")
    .optional(),
});

export const GET = withSession(async (req, { userId }) => {
  const parsed = parseQuery(req, querySchema);
  if ("response" in parsed) return parsed.response;
  const { favorite, limit, cursor } = parsed.data;

  const page = await getPhraseRepository().listGroups(userId, {
    favorite,
    limit,
    cursor,
  });
  const { HISTORY_LIMIT, PHRASEBOOK_LIMIT } = getEnv();
  return Response.json({
    ...page,
    limit: favorite ? PHRASEBOOK_LIMIT : HISTORY_LIMIT,
  });
});
