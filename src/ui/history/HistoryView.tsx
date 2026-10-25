"use client";

import { Button, Stack, Text } from "@mantine/core";
import Link from "next/link";
import { useState } from "react";
import { PhraseGroupList } from "./PhraseGroupList";
import { type ShowIn, ShowInSelect } from "./ShowInSelect";

export function HistoryView() {
  const [showIn, setShowIn] = useState<ShowIn>("all");
  return (
    <Stack gap="lg">
      <ShowInSelect value={showIn} onChange={setShowIn} />
      <PhraseGroupList
        favorite={false}
        showIn={showIn}
        note={(limit) => (
          <Text size="sm" c="dimmed">
            Keeps your last {limit} phrases. Starred phrases stay.
          </Text>
        )}
        empty={
          <Stack align="flex-start" gap="xs">
            <Text c="dimmed">
              Nothing here yet. Translate something and it will show up.
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
