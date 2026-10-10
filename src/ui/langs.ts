import type { Lang } from "@/server/db/schema";

export const LANG_ORDER: readonly Lang[] = ["es", "en", "fr"];

export const LANG_LABELS: Record<Lang, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
};

export const LANG_FLAGS: Record<Lang, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  fr: "🇫🇷",
};
