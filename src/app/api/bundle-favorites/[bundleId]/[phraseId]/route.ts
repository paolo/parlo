import { getPhraseRepository, getProfileRepository } from "@/server/container";
import { jsonError, withSession } from "@/server/http/responses";
import { buildBundleGroup, bundleRef } from "@/server/phrases/bundles";
import { PhrasebookFullError } from "@/server/phrases/types";

type Params = { bundleId: string; phraseId: string };

/** Favorites a bundle phrase for the user, saving it to their phrasebook the first time. Safe to repeat. */
export const PUT = withSession<Params>(async (_req, { userId, params }) => {
  const languages = await getProfileRepository().getProfile(userId);
  if (languages.length === 0) return jsonError(409, "profile_incomplete");
  const group = await buildBundleGroup(
    userId,
    params.bundleId,
    params.phraseId,
    languages,
  );
  if (!group) return jsonError(404, "not_found");
  try {
    return Response.json({
      group: await getPhraseRepository().favoriteBundleGroup(group),
    });
  } catch (error) {
    if (error instanceof PhrasebookFullError) {
      return jsonError(409, "phrasebook_full", { limit: error.limit });
    }
    throw error;
  }
});

/** Removes the user's saved copy of a bundle phrase. Nothing to remove is fine. */
export const DELETE = withSession<Params>(async (_req, { userId, params }) => {
  await getPhraseRepository().deleteBundleGroup(
    userId,
    bundleRef(params.bundleId, params.phraseId),
  );
  return new Response(null, { status: 204 });
});
