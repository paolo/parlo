import { Text } from "@mantine/core";
import { LANGUAGES, type Lang, regionName } from "../shared/languages";
import { Flag } from "./Flag";

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
      <Flag region={region ?? defaultRegion} /> {endonym}
      {region && region !== defaultRegion && (
        <Text span c="dimmed">
          {" · "}
          {regionName(region)}
        </Text>
      )}
    </>
  );
}
