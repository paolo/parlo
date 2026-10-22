import { LANGUAGES } from "@/shared/languages";

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
  /** The Spanish-speaking country the Spanish phrase is at home in; its flag is shown beside the phrase. */
  esRegion: "MX" | "BO";
  /** Short English gloss of the shared meaning, for assistive technology. */
  meaning: string;
  /** One idiomatic phrase per language: the meaning carried across, never a literal translation. */
  phrases: Record<NativeLang | "en" | "fr", string>;
}

// Everything that is not English or French is unreviewed by a speaker: see the release gate in the plan.
export const PHRASE_SETS: readonly PhraseSet[] = [
  {
    id: "very-cold",
    esRegion: "MX",
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
  {
    id: "give-er",
    esRegion: "BO",
    canadian: true,
    meaning: "Go all out, give it everything",
    phrases: {
      fr: "Vas-y à fond!",
      en: "Give'r!",
      es: "¡Dale con todo!",
      pt: "Manda ver!",
      uk: "Дай жару!",
      zh: "加把劲儿!",
      hi: "जी-जान लगा दो!",
      pa: "ਪੂਰਾ ਜ਼ੋਰ ਲਾ ਦੇ!",
    },
  },
  {
    id: "works-for-me",
    esRegion: "MX",
    canadian: true,
    meaning: "Agreed, that works for me",
    phrases: {
      fr: "Ça marche!",
      en: "Sounds good to me",
      es: "¡Trato hecho!",
      pt: "Fechado!",
      uk: "Домовились!",
      zh: "一言为定!",
      hi: "ठीक है, पक्का!",
      pa: "ਠੀਕ ਆ, ਪੱਕਾ!",
    },
  },
  {
    id: "rain-check",
    esRegion: "BO",
    canadian: true,
    meaning: "Maybe another time",
    phrases: {
      fr: "Ce sera pour une prochaine fois",
      en: "I'll take a rain check",
      es: "Otra vez será",
      pt: "Fica pra próxima",
      uk: "Може, іншим разом",
      zh: "改天吧",
      hi: "फिर कभी सही",
      pa: "ਫੇਰ ਕਦੇ ਸਹੀ",
    },
  },
  {
    id: "costs-a-fortune",
    esRegion: "BO",
    canadian: false,
    meaning: "It is very expensive",
    phrases: {
      fr: "Ça coûte les yeux de la tête",
      en: "It costs an arm and a leg",
      es: "Cuesta un ojo de la cara",
      pt: "Custa os olhos da cara",
      uk: "Коштує кругленьку суму",
      zh: "贵得要命",
      hi: "इसकी कीमत आसमान छू रही है",
      pa: "ਇਹਦੇ ਭਾਅ ਤਾਂ ਅਸਮਾਨ ਛੂਹ ਰਹੇ ਨੇ",
    },
  },
  {
    id: "keep-a-secret",
    esRegion: "MX",
    canadian: false,
    meaning: "Do not reveal the secret",
    phrases: {
      fr: "Ne vends pas la mèche",
      en: "Don't spill the beans",
      es: "No vayas a soltar la sopa",
      pt: "Não dê com a língua nos dentes",
      uk: "Не розпускай язика",
      zh: "别说漏嘴",
      hi: "राज़ मत खोल देना",
      pa: "ਭੇਤ ਨਾ ਖੋਲ੍ਹ ਦੇਣਾ",
    },
  },
  {
    id: "wiped-out",
    esRegion: "BO",
    canadian: false,
    meaning: "I am completely exhausted",
    phrases: {
      fr: "Je suis crevé",
      en: "I'm totally wiped out",
      es: "Estoy hecho polvo",
      pt: "Tô morto de cansado",
      uk: "Я без задніх ніг",
      zh: "我累得像条狗",
      hi: "मैं थककर चूर हो गया",
      pa: "ਮੈਂ ਤਾਂ ਥੱਕ ਕੇ ਚੂਰ ਹੋ ਗਿਆ",
    },
  },
  {
    id: "easy",
    esRegion: "MX",
    canadian: false,
    meaning: "It is very easy",
    phrases: {
      fr: "C'est du gâteau",
      en: "It's a piece of cake",
      es: "Es pan comido",
      pt: "É moleza",
      uk: "Це раз плюнути",
      zh: "小菜一碟",
      hi: "यह तो बाएँ हाथ का खेल है",
      pa: "ਇਹ ਤਾਂ ਖੱਬੇ ਹੱਥ ਦੀ ਖੇਡ ਆ",
    },
  },
];

/** Flags that differ from the language's usual one in the app: Portuguese is shown with Brazil's. */
const REGION_OVERRIDES: Partial<Record<NativeLang, string>> = { pt: "BR" };

/**
 * The conversation shown at a rotation step. The native language cycles every step; the phrase set moves one
 * further each full round of languages, so every set meets every language (this relies on the number of sets
 * and the number of languages plus one having no common factor, which the tests check).
 */
export function conversationAt(step: number): {
  set: PhraseSet;
  native: NativeLang;
  /** Country whose flag is shown beside the native phrase. */
  region: string;
} {
  const round = Math.floor(step / NATIVE_CYCLE.length);
  const set = PHRASE_SETS[(step + round) % PHRASE_SETS.length];
  const native = NATIVE_CYCLE[step % NATIVE_CYCLE.length];
  if (!set || !native) throw new Error("No landing phrases configured");
  const region =
    native === "es"
      ? set.esRegion
      : (REGION_OVERRIDES[native] ?? LANGUAGES[native].defaultRegion);
  return { set, native, region };
}
