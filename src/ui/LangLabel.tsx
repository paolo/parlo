import { Text } from "@mantine/core";
import type { CSSProperties } from "react";
import { LANGUAGES, type Lang, regionName } from "../shared/languages";
import { Flag } from "./Flag";
import { useProfileRegion } from "./queries";
import type { Role } from "./roles";

/** Flag and language name, never the flag alone; a region other than the default is named too. */
export function LangLabel({
  lang,
  region,
  flagSize,
  ring,
  showRegion = true,
}: {
  lang: Lang;
  region?: string | null;
  flagSize?: CSSProperties["width"];
  ring?: Role;
  /** False keeps the flag of the region but drops its name, for tight rows such as a segmented control. */
  showRegion?: boolean;
}) {
  const { endonym, defaultRegion } = LANGUAGES[lang];
  // Without an explicit region, show the one the user picked for this language: History and the Phrasebook then
  // follow a change in the profile. A language that is not one of theirs keeps its usual flag.
  const picked = useProfileRegion(lang);
  const flagRegion = region ?? picked ?? defaultRegion;
  return (
    <>
      <Flag region={flagRegion} size={flagSize} ring={ring} /> {endonym}
      {showRegion && region && region !== defaultRegion && (
        <Text span c="dimmed">
          {" · "}
          {regionName(region)}
        </Text>
      )}
    </>
  );
}
