import { getPhraseRepository } from "@/server/container";
import { jsonError, withSession } from "@/server/http/responses";

// Only the phrasebook's listing for now; task 1.8 adds the full history with search and paging.
export const GET = withSession(async (req, { userId }) => {
  const favorite = new URL(req.url).searchParams.get("favorite");
  if (favorite !== "true") {
    return jsonError(400, "invalid_input", {
      fields: { favorite: ["Only favorite=true is supported"] },
    });
  }
  return Response.json({
    items: await getPhraseRepository().listFavorites(userId),
  });
});
