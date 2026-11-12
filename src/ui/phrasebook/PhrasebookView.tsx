"use client";

import { Button, Group, SegmentedControl, Stack, Text } from "@mantine/core";
import Link from "next/link";
import { useState } from "react";
import { RECENT_DAYS } from "../../shared/recent";
import { PhraseGroupList } from "../history/PhraseGroupList";
import { type ShowIn, ShowInSelect } from "../history/ShowInSelect";

type Filter = "saved" | "recent";

/** The phrases the user saved, newest first; Recent shows what they translated in the last few days. */
export function PhrasebookView() {
  const [filter, setFilter] = useState<Filter>("saved");
  const [showIn, setShowIn] = useState<ShowIn>("all");
  const saved = filter === "saved";

  return (
    <Stack gap="lg">
      <Group gap="md">
        <SegmentedControl
          aria-label="Phrases"
          value={filter}
          onChange={(next) => setFilter(next as Filter)}
          data={[
            { value: "saved", label: "Saved" },
            { value: "recent", label: "Recent" },
          ]}
        />
        <ShowInSelect value={showIn} onChange={setShowIn} />
      </Group>
      <PhraseGroupList
        // Remount on a filter change so each list keeps its own scroll and loading state.
        key={filter}
        list={filter}
        showIn={showIn}
        note={(limit) => (
          <Text size="sm" c="dimmed">
            {saved
              ? `Holds up to ${limit} saved phrases.`
              : `Your phrases from the last ${RECENT_DAYS} days. Save one to keep it.`}
          </Text>
        )}
        empty={
          <Stack align="flex-start" gap="xs">
            <Text c="dimmed">
              {saved
                ? "You haven't saved any phrases yet. Save a translation to keep it here and practice it."
                : `Nothing from the last ${RECENT_DAYS} days. Translate something and it shows up here.`}
            </Text>
            <Button component={Link} href="/translate">
              Go to Translate
            </Button>
          </Stack>
        }
      />
    </Stack>
  );
}
