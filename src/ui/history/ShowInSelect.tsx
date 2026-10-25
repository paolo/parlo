"use client";

import { Box, SegmentedControl } from "@mantine/core";
import type { Lang } from "../../shared/languages";
import { LangLabel } from "../LangLabel";
import { useProfile } from "../queries";

export type ShowIn = Lang | "all";

/** "Show in" control: every language of a group, or just one of the user's languages. */
export function ShowInSelect({
  value,
  onChange,
}: {
  value: ShowIn;
  onChange: (value: ShowIn) => void;
}) {
  const profile = useProfile();
  const languages = profile.data?.languages ?? [];
  return (
    // Three languages with flags can be wider than a phone: scroll inside the row instead of widening the page.
    <Box
      style={{ overflowX: "auto", maxWidth: "100%", scrollbarWidth: "none" }}
    >
      <SegmentedControl
        aria-label="Show in"
        value={value}
        onChange={(next) => onChange(next as ShowIn)}
        data={[
          { value: "all", label: "All" },
          ...languages.map(({ lang, region }) => ({
            value: lang,
            label: <LangLabel lang={lang} region={region} showRegion={false} />,
          })),
        ]}
      />
    </Box>
  );
}
