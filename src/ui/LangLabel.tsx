import { Text } from "@mantine/core";
import type { CSSProperties } from "react";
import { LANGUAGES, type Lang, regionName } from "../shared/languages";
import { Flag } from "./Flag";
import type { Role } from "./roles";

/** Flag and language name, never the flag alone; a region other than the default is named too. */
export function LangLabel({
  lang,
  region,
  flagSize,
  ring,
}: {
  lang: Lang;
  region?: string | null;
  flagSize?: CSSProperties["width"];
  ring?: Role;
}) {
  const { endonym, defaultRegion } = LANGUAGES[lang];
  return (
    <>
      <Flag region={region ?? defaultRegion} size={flagSize} ring={ring} />{" "}
      {endonym}
      {region && region !== defaultRegion && (
        <Text span c="dimmed">
          {" · "}
          {regionName(region)}
        </Text>
      )}
    </>
  );
}
