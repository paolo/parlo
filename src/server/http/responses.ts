import { getSession } from "@/server/auth/session";

export function jsonError(
  status: number,
  error: string,
  extra: Record<string, unknown> = {},
): Response {
  return Response.json({ error, ...extra }, { status });
}

type HandlerContext<P> = { params: Promise<P> };
type SessionHandler<P> = (
  req: Request,
  ctx: { userId: string; params: P },
) => Promise<Response>;

/** Wraps a route handler: 401 without a session, 500 (logged, no details) on unexpected errors. */
export function withSession<P = Record<string, never>>(
  handler: SessionHandler<P>,
) {
  return async (req: Request, ctx: HandlerContext<P>): Promise<Response> => {
    try {
      const session = await getSession(req.headers);
      if (!session) return jsonError(401, "unauthorized");
      return await handler(req, {
        userId: session.userId,
        params: await ctx.params,
      });
    } catch (error) {
      console.error(
        `Unhandled error in ${req.method} ${new URL(req.url).pathname}`,
        error,
      );
      return jsonError(500, "internal_error");
    }
  };
}
