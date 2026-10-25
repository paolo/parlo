"use client";

import { Button, Group, SegmentedControl, Stack, Text } from "@mantine/core";
import Link from "next/link";
import { useState } from "react";
import { PhraseGroupList } from "../history/PhraseGroupList";
import { type ShowIn, ShowInSelect } from "../history/ShowInSelect";

type Filter = "all" | "starred";

/** Everything the user has translated, newest first, with the starred phrases one tap away. */
export function PhrasebookView() {
  const [filter, setFilter] = useState<Filter>("all");
  const [showIn, setShowIn] = useState<ShowIn>("all");
  const starred = filter === "starred";

  return (
    <Stack gap="lg">
      <Group gap="md">
        <SegmentedControl
          aria-label="Phrases"
          value={filter}
          onChange={(next) => setFilter(next as Filter)}
          data={[
            { value: "all", label: "All" },
            { value: "starred", label: "Starred" },
          ]}
        />
        <ShowInSelect value={showIn} onChange={setShowIn} />
      </Group>
      <PhraseGroupList
        // Remount on a filter change so each list keeps its own scroll and loading state.
        key={filter}
        favorite={starred}
        showIn={showIn}
        note={(limit) => (
          <Text size="sm" c="dimmed">
            {starred
              ? `Holds up to ${limit} starred phrases.`
              : `Keeps your last ${limit} phrases. Starred phrases stay.`}
          </Text>
        )}
        empty={
          <Stack align="flex-start" gap="xs">
            <Text c="dimmed">
              {starred
                ? "You haven't starred anything yet. Star a translation to keep it here."
                : "Nothing here yet. Translate something and it will show up."}
            </Text>
            <Button component={Link} href="/">
              Go to Translate
            </Button>
          </Stack>
        }
      />
    </Stack>
  );
}
