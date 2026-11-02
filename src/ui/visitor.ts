import type { ProfileLanguage } from "@/server/profile/types";
import { LANG_CODES, LANGUAGES, type Lang } from "../shared/languages";

const KEY = "parlo.visitor";

/** The languages a visitor starts from on the landing page's main cards: all but English and French. */
export const VISITOR_NATIVES: Lang[] = LANG_CODES.filter(
  (lang) => lang !== "en" && lang !== "fr",
);

/** English and French are what the cards bring most visitors to, but someone can start from either one too. */
export const VISITOR_ALSO: Lang[] = ["en", "fr"];

/** Where a visitor says they are from: a native language and the country it is theirs in. */
export interface VisitorPick {
  lang: Lang;
  region: string;
}

/**
 * The pick saved on the landing page, or null when there is none worth trusting. A pick saved as just a language
 * (the first version) takes that language's default country; a country that doesn't fit the language is replaced
 * the same way.
 */
export function loadVisitorNative(): VisitorPick | null {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "");
    const { lang, region } =
      typeof stored === "string"
        ? { lang: stored, region: undefined }
        : ((stored ?? {}) as { lang?: unknown; region?: unknown });
    const known = LANG_CODES.find((l) => l === lang);
    if (!known) return null;
    return {
      lang: known,
      region:
        typeof region === "string" && LANGUAGES[known].regions.includes(region)
          ? region
          : LANGUAGES[known].defaultRegion,
    };
  } catch {
    return null;
  }
}

export function saveVisitorNative(pick: VisitorPick): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(pick));
  } catch {
    // Storage can be blocked; the pick just isn't remembered.
  }
}

export function clearVisitorNative(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
}

/**
 * The three languages of a visitor's round and of the signup picker: their own, then English (Canada) and French
 * (France). Starting from English the other two are French and Spanish; starting from French, English and Spanish.
 */
export function visitorLanguages({
  lang,
  region,
}: VisitorPick): ProfileLanguage[] {
  const others: { lang: Lang; region: string }[] =
    lang === "en"
      ? [
          { lang: "fr", region: "FR" },
          { lang: "es", region: LANGUAGES.es.defaultRegion },
        ]
      : lang === "fr"
        ? [
            { lang: "en", region: "CA" },
            { lang: "es", region: LANGUAGES.es.defaultRegion },
          ]
        : [
            { lang: "en", region: "CA" },
            { lang: "fr", region: "FR" },
          ];
  return [
    { lang, region, level: "native", position: 0 },
    ...others.map((other, i) => ({
      ...other,
      level: "intermediate" as const,
      position: i + 1,
    })),
  ];
}
