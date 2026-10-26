"use client";

import { Button, Group, SegmentedControl, Stack, Text } from "@mantine/core";
import Link from "next/link";
import { useState } from "react";
import { PhraseGroupList } from "../history/PhraseGroupList";
import { type ShowIn, ShowInSelect } from "../history/ShowInSelect";

type Filter = "all" | "favorites";

/** The phrases the user favorited, newest first; All shows everything they have translated. */
export function PhrasebookView() {
  const [filter, setFilter] = useState<Filter>("favorites");
  const [showIn, setShowIn] = useState<ShowIn>("all");
  const favorites = filter === "favorites";

  return (
    <Stack gap="lg">
      <Group gap="md">
        <SegmentedControl
          aria-label="Phrases"
          value={filter}
          onChange={(next) => setFilter(next as Filter)}
          data={[
            { value: "favorites", label: "Favorites" },
            { value: "all", label: "All" },
          ]}
        />
        <ShowInSelect value={showIn} onChange={setShowIn} />
      </Group>
      <PhraseGroupList
        // Remount on a filter change so each list keeps its own scroll and loading state.
        key={filter}
        favorite={favorites}
        showIn={showIn}
        note={(limit) => (
          <Text size="sm" c="dimmed">
            {favorites
              ? `Holds up to ${limit} favorite phrases.`
              : `Keeps your last ${limit} phrases. Favorite phrases stay.`}
          </Text>
        )}
        empty={
          <Stack align="flex-start" gap="xs">
            <Text c="dimmed">
              {favorites
                ? "You haven't added any favorites yet. Add a translation to your favorites to keep it here and practice it."
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
