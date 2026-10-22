export type NativeLang = "es" | "pt" | "uk" | "zh" | "hi" | "pa";

/** The rotating native language, in the order the landing page cycles through it. */
export const NATIVE_CYCLE: readonly NativeLang[] = [
  "es",
  "pt",
  "uk",
  "zh",
  "hi",
  "pa",
];

export interface PhraseSet {
  id: string;
  canadian: boolean;
  /** Short English gloss of the shared meaning, for assistive technology. */
  meaning: string;
  /** One idiomatic phrase per language: the meaning carried across, never a literal translation. */
  phrases: Record<NativeLang | "en" | "fr", string>;
}

// Everything that is not English or French is unreviewed by a speaker: see the release gate in the plan.
export const PHRASE_SETS: readonly PhraseSet[] = [
  {
    id: "very-cold",
    canadian: true,
    meaning: "It is very cold outside",
    phrases: {
      fr: "Il fait frette",
      en: "It's freezing out",
      es: "Hace un frío que pela",
      pt: "Tá um frio de rachar",
      uk: "Дубак надворі",
      zh: "外面冻死人了",
      hi: "कड़ाके की ठंड पड़ रही है",
      pa: "ਕੜਾਕੇ ਦੀ ਠੰਢ ਪੈ ਰਹੀ ਹੈ",
    },
  },
];

/** The conversation shown at a rotation step: both cycles advance together but wrap independently. */
export function conversationAt(step: number): {
  set: PhraseSet;
  native: NativeLang;
} {
  const set = PHRASE_SETS[step % PHRASE_SETS.length];
  const native = NATIVE_CYCLE[step % NATIVE_CYCLE.length];
  if (!set || !native) throw new Error("No landing phrases configured");
  return { set, native };
}
