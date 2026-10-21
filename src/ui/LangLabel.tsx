import { Text } from "@mantine/core";
import {
  LANGUAGES,
  type Lang,
  languageFlag,
  regionName,
} from "../shared/languages";

/** Flag and language name, never the flag alone; a region other than the default is named too. */
export function LangLabel({
  lang,
  region,
}: {
  lang: Lang;
  region?: string | null;
}) {
  const { endonym, defaultRegion } = LANGUAGES[lang];
  return (
    <>
      {languageFlag(lang, region ?? null)} {endonym}
      {region && region !== defaultRegion && (
        <Text span c="dimmed">
          {" · "}
          {regionName(region)}
        </Text>
      )}
    </>
  );
}
