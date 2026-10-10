import type { z } from "zod";
import { jsonError } from "./responses";

/** Parses a JSON body against a schema. Returns the data, or a 400 response to send back. */
export async function parseJson<T extends z.ZodType>(
  req: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { response: Response }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      response: jsonError(400, "invalid_input", {
        fields: { body: ["Body must be valid JSON"] },
      }),
    };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "body";
      fields[key] = [...(fields[key] ?? []), issue.message];
    }
    return { response: jsonError(400, "invalid_input", { fields }) };
  }
  return { data: result.data };
}
