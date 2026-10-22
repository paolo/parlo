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
  {
    id: "give-er",
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
    canadian: false,
    meaning: "Do not reveal the secret",
    phrases: {
      fr: "Ne vends pas la mèche",
      en: "Don't spill the beans",
      es: "No vayas a soltar prenda",
      pt: "Não dê com a língua nos dentes",
      uk: "Не розпускай язика",
      zh: "别说漏嘴",
      hi: "राज़ मत खोल देना",
      pa: "ਭੇਤ ਨਾ ਖੋਲ੍ਹ ਦੇਣਾ",
    },
  },
  {
    id: "wiped-out",
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
    canadian: false,
    meaning: "It is very easy",
    phrases: {
      fr: "C'est du gâteau",
      en: "It's a piece of cake",
      es: "Está chupado",
      pt: "É moleza",
      uk: "Це раз плюнути",
      zh: "小菜一碟",
      hi: "यह तो बाएँ हाथ का खेल है",
      pa: "ਇਹ ਤਾਂ ਖੱਬੇ ਹੱਥ ਦੀ ਖੇਡ ਆ",
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
