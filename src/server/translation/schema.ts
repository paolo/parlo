import { z } from "zod";
import { LANG_CODES } from "../../shared/languages";

// Kept to features structured outputs supports: enums, nullable fields, plain strings (no length limits).
export const translationOutputSchema = z.object({
  detectedLang: z.enum([...LANG_CODES, "other"]),
  correction: z
    .object({
      text: z.string(),
      explanation: z.string(),
    })
    .nullable(),
  translations: z.array(
    z.object({
      lang: z.enum(LANG_CODES),
      text: z.string(),
    }),
  ),
  notes: z.string().nullable(),
});
