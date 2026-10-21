export interface CursorPosition {
  /** Postgres's own text for `created_at`, so microseconds survive (a JS Date keeps milliseconds). */
  createdAt: string;
  id: string;
}

const TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}(:?\d{2})?)$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeCursor({ createdAt, id }: CursorPosition): string {
  return Buffer.from(JSON.stringify({ c: createdAt, i: id })).toString(
    "base64url",
  );
}

/** The position inside a cursor, or null when it is not one this module produced. */
export function decodeCursor(cursor: string): CursorPosition | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    );
    if (typeof parsed !== "object" || parsed === null) return null;
    const { c, i } = parsed as { c?: unknown; i?: unknown };
    if (typeof c !== "string" || typeof i !== "string") return null;
    if (!TIMESTAMP.test(c) || !UUID.test(i)) return null;
    return { createdAt: c, id: i };
  } catch {
    return null;
  }
}
