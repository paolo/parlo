import { LANGUAGES, type Lang, languageFlag } from "../shared/languages";

export function LangLabel({ lang }: { lang: Lang }) {
  return (
    <>
      {languageFlag(lang, null)} {LANGUAGES[lang].endonym}
    </>
  );
}
