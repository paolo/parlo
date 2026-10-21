import { z } from "zod";
import { isRegionOf, LANG_CODES, PROFILE_SIZE } from "../../shared/languages";

export const profileBodySchema = z.object({
  languages: z
    .array(
      z
        .object({
          lang: z.enum(LANG_CODES),
          region: z.string().optional(),
        })
        .refine(
          ({ lang, region }) =>
            region === undefined || isRegionOf(lang, region),
          {
            message: "Region does not belong to this language",
            path: ["region"],
          },
        ),
    )
    .length(PROFILE_SIZE, `Pick exactly ${PROFILE_SIZE} languages`)
    .refine(
      (languages) =>
        new Set(languages.map((l) => l.lang)).size === languages.length,
      {
        message: "Each language can only be picked once",
      },
    ),
});
