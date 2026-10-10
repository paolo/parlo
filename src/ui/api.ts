/** An HTTP error from our API, carrying the JSON body ({ error, ...details }) when there is one. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ({ error?: string } & Record<string, unknown>) | null,
  ) {
    super(
      `API request failed with ${status}${body?.error ? ` (${body.error})` : ""}`,
    );
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}
