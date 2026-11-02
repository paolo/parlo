import { LANG_CODES, LANGUAGES, type Lang, regionName } from "./languages";

/** The countries where at least one of `langs` is spoken, once each, alphabetical by their English name. */
export function countriesFor(langs: readonly Lang[]): string[] {
  const countries = new Set(langs.flatMap((lang) => LANGUAGES[lang].regions));
  return [...countries].sort((a, b) =>
    regionName(a).localeCompare(regionName(b)),
  );
}

/** Which of `langs` are spoken in `country`, in the app's language order. */
export function languagesIn(country: string, langs: readonly Lang[]): Lang[] {
  return LANG_CODES.filter(
    (lang) => langs.includes(lang) && LANGUAGES[lang].regions.includes(country),
  );
}
