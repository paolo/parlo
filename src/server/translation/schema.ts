import { z } from "zod";
import { LANG_CODES } from "../../shared/languages";

// Kept to features structured outputs supports: enums, nullable fields, plain strings (no length limits).
// The key order is the order the model writes them, and the answer is streamed to the user as it is written:
// the detected language first (it gates the request), the translations next (what the user is waiting for),
// then the extras. See progress.ts, which reads the text while it is still arriving.
export const translationOutputSchema = z.object({
  detectedLang: z.enum([...LANG_CODES, "other"]),
  translations: z.array(
    z.object({
      lang: z.enum(LANG_CODES),
      text: z.string(),
    }),
  ),
  correction: z
    .object({
      text: z.string(),
      explanation: z.string(),
    })
    .nullable(),
  notes: z.string().nullable(),
});
