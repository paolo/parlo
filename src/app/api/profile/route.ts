import { getProfileRepository } from "@/server/container";
import { withSession } from "@/server/http/responses";
import { parseJson } from "@/server/http/validation";
import { profileBodySchema } from "@/server/profile/schema";
import { buildProfile } from "@/server/profile/service";

export const GET = withSession(async (_req, { userId }) => {
  const languages = await getProfileRepository().getProfile(userId);
  return Response.json({ languages });
});

export const PUT = withSession(async (req, { userId }) => {
  const parsed = await parseJson(req, profileBodySchema);
  if ("response" in parsed) return parsed.response;

  const languages = buildProfile(parsed.data.languages);
  await getProfileRepository().replaceProfile(userId, languages);
  return Response.json({ languages });
});
