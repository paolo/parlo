import { getAuth } from "./auth";

export interface SessionInfo {
  userId: string;
}

export async function getSession(
  headers: Headers,
): Promise<SessionInfo | null> {
  const result = await getAuth().api.getSession({ headers });
  return result ? { userId: result.user.id } : null;
}
