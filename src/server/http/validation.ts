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
  return validate(schema, body, "body");
}

/** Parses the query string against a schema. Returns the data, or a 400 response to send back. */
export function parseQuery<T extends z.ZodType>(
  req: Request,
  schema: T,
): { data: z.infer<T> } | { response: Response } {
  const query = Object.fromEntries(new URL(req.url).searchParams);
  return validate(schema, query, "query");
}

function validate<T extends z.ZodType>(
  schema: T,
  value: unknown,
  root: string,
): { data: z.infer<T> } | { response: Response } {
  const result = schema.safeParse(value);
  if (!result.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || root;
      fields[key] = [...(fields[key] ?? []), issue.message];
    }
    return { response: jsonError(400, "invalid_input", { fields }) };
  }
  return { data: result.data };
}
