import type { ProfileLanguage } from "@/server/profile/types";
import { LANG_CODES, LANGUAGES, type Lang } from "../shared/languages";

const KEY = "parlo.visitor";

/** English and French are the languages being learned, so a visitor's native pick is any of the others. */
export const VISITOR_NATIVES: Lang[] = LANG_CODES.filter(
  (lang) => lang !== "en" && lang !== "fr",
);

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
    const known = VISITOR_NATIVES.find((l) => l === lang);
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

/** The three languages of a visitor's round and of the signup picker: their own, English (Canada), French (France). */
export function visitorLanguages({
  lang,
  region,
}: VisitorPick): ProfileLanguage[] {
  return [
    { lang, region, level: "native", position: 0 },
    { lang: "en", region: "CA", level: "intermediate", position: 1 },
    { lang: "fr", region: "FR", level: "intermediate", position: 2 },
  ];
}
