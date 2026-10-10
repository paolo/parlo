import { z } from "zod";
import { LANGS } from "../db/schema";

// Kept to features structured outputs supports: enums, nullable fields, plain strings (no length limits).
export const translationOutputSchema = z.object({
  detectedLang: z.enum([...LANGS, "other"]),
  correction: z
    .object({
      text: z.string(),
      explanation: z.string(),
    })
    .nullable(),
  translations: z.object({
    es: z.string(),
    en: z.string(),
    fr: z.string(),
  }),
  notes: z.string().nullable(),
});
