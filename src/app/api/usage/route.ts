import { getUsageLimiter } from "@/server/container";
import { withSession } from "@/server/http/responses";

export const GET = withSession(async (_req, { userId }) => {
  return Response.json(await getUsageLimiter().usage(userId));
});
