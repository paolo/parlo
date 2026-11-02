import type { ProfileLanguage } from "@/server/profile/types";
import { LANG_CODES, LANGUAGES, type Lang } from "../shared/languages";

const KEY = "parlo.visitor";

/** English and French are the languages being learned, so a visitor's native pick is any of the others. */
export const VISITOR_NATIVES: Lang[] = LANG_CODES.filter(
  (lang) => lang !== "en" && lang !== "fr",
);

/** The native language a visitor picked on the landing page, or null when there is none worth trusting. */
export function loadVisitorNative(): Lang | null {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "");
    return VISITOR_NATIVES.find((lang) => lang === stored) ?? null;
  } catch {
    return null;
  }
}

export function saveVisitorNative(lang: Lang): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lang));
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
export function visitorLanguages(native: Lang): ProfileLanguage[] {
  return [
    {
      lang: native,
      region: LANGUAGES[native].defaultRegion,
      level: "native",
      position: 0,
    },
    { lang: "en", region: "CA", level: "intermediate", position: 1 },
    { lang: "fr", region: "FR", level: "intermediate", position: 2 },
  ];
}
