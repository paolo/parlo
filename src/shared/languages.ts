// Shared by server and UI: no imports from src/server or src/ui.

export const LANG_CODES = [
  "es",
  "en",
  "fr",
  "uk",
  "pt",
  "zh",
  "pa",
  "tl",
  "ar",
  "hi",
  "ru",
  "it",
  "fa",
] as const;
export type Lang = (typeof LANG_CODES)[number];

/** Every user picks exactly this many languages; position 0 is the native one. */
export const PROFILE_SIZE = 3;

export interface LanguageInfo {
  code: Lang;
  /** The language's own name, shown in the UI. */
  endonym: string;
  /** English name, used in prompts. */
  name: string;
  /** ISO 3166-1 alpha-2; always the first of `regions`. */
  defaultRegion: string;
  regions: readonly string[];
}

function language(
  code: Lang,
  endonym: string,
  name: string,
  regions: readonly string[],
): LanguageInfo {
  return { code, endonym, name, defaultRegion: regions[0], regions };
}

export const LANGUAGES: Record<Lang, LanguageInfo> = {
  es: language("es", "Español", "Spanish", [
    "ES",
    "MX",
    "CO",
    "AR",
    "PE",
    "VE",
    "CL",
    "EC",
    "BO",
    "UY",
    "PY",
    "CR",
    "PA",
    "DO",
    "CU",
    "GT",
    "HN",
    "SV",
    "NI",
    "PR",
  ]),
  en: language("en", "English", "English", [
    "GB",
    "CA",
    "US",
    "AU",
    "IE",
    "NG",
    "IN",
    "PH",
    "ZA",
    "JM",
  ]),
  fr: language("fr", "Français", "French", [
    "FR",
    "CA",
    "BE",
    "CH",
    "CI",
    "SN",
    "CD",
    "HT",
    "MA",
    "DZ",
  ]),
  uk: language("uk", "Українська", "Ukrainian", ["UA"]),
  pt: language("pt", "Português", "Portuguese", ["PT", "BR", "AO", "MZ"]),
  zh: language("zh", "中文", "Mandarin Chinese", ["CN", "TW", "SG"]),
  pa: language("pa", "ਪੰਜਾਬੀ", "Punjabi", ["IN", "PK"]),
  tl: language("tl", "Tagalog", "Tagalog", ["PH"]),
  ar: language("ar", "العربية", "Arabic", [
    "SA",
    "EG",
    "MA",
    "DZ",
    "LB",
    "IQ",
    "SY",
    "SD",
    "JO",
  ]),
  hi: language("hi", "हिन्दी", "Hindi", ["IN"]),
  ru: language("ru", "Русский", "Russian", ["RU", "UA", "KZ", "BY"]),
  it: language("it", "Italiano", "Italian", ["IT", "CH"]),
  fa: language("fa", "فارسی", "Persian", ["IR", "AF"]),
};

const REGIONAL_INDICATOR_A = 0x1f1e6;

/** Flag emoji for an ISO 3166-1 alpha-2 code, built from regional indicator symbols. */
export function regionFlag(region: string): string {
  return [...region.toUpperCase()]
    .map((char) =>
      String.fromCodePoint(REGIONAL_INDICATOR_A + char.charCodeAt(0) - 65),
    )
    .join("");
}

export function languageFlag(lang: Lang, region: string | null): string {
  return regionFlag(region ?? LANGUAGES[lang].defaultRegion);
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function regionName(region: string): string {
  return regionNames.of(region) ?? region;
}

export function isRegionOf(lang: Lang, region: string): boolean {
  return LANGUAGES[lang].regions.includes(region);
}
