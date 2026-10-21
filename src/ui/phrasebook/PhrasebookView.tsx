"use client";

import { Button, Group, Stack, Text } from "@mantine/core";
import Link from "next/link";
import { useState } from "react";
import { PhraseGroupList } from "../history/PhraseGroupList";
import { type ShowIn, ShowInSelect } from "../history/ShowInSelect";
import { usePhraseGroups } from "../queries";

export function PhrasebookView() {
  const [showIn, setShowIn] = useState<ShowIn>("all");
  // Same query as the list below, so this adds no request.
  const favorites = usePhraseGroups({ favorite: true });
  const hasStarred = (favorites.data?.pages[0]?.items.length ?? 0) > 0;

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <ShowInSelect value={showIn} onChange={setShowIn} />
        {hasStarred ? (
          <Button component={Link} href="/phrasebook/review">
            Review
          </Button>
        ) : (
          <Button disabled>Review</Button>
        )}
      </Group>
      <PhraseGroupList
        favorite
        showIn={showIn}
        note={(limit) => (
          <Text size="sm" c="dimmed">
            Holds up to {limit} starred phrases.
          </Text>
        )}
        empty={
          <Stack align="flex-start" gap="xs">
            <Text c="dimmed">
              You haven't starred anything yet. Star a translation to keep it
              here.
            </Text>
            <Button component={Link} href="/" variant="light">
              Go to Translate
            </Button>
          </Stack>
        }
      />
    </Stack>
  );
}
