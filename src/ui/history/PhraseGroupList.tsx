"use client";

import { Alert, Button, Loader, Stack } from "@mantine/core";
import type { ReactNode } from "react";
import { errorMessage } from "../errors";
import { usePhraseGroups, useProfile } from "../queries";
import { GroupItem } from "./GroupItem";
import type { ShowIn } from "./ShowInSelect";

/** A user's saved or recent groups, newest first, loaded a page at a time. */
export function PhraseGroupList({
  list,
  showIn,
  empty,
  note,
}: {
  list: "saved" | "recent";
  showIn: ShowIn;
  empty: ReactNode;
  note?: (limit: number) => ReactNode;
}) {
  const groups = usePhraseGroups({ list });
  const profile = useProfile();

  if (groups.isPending) return <Loader size="sm" />;
  if (groups.isError) {
    return (
      <Alert color="red" title="Couldn't load your phrases">
        {errorMessage(groups.error)}
      </Alert>
    );
  }
  const items = groups.data.pages.flatMap((page) => page.items);
  if (items.length === 0) return <>{empty}</>;

  const profileLangs = profile.data?.languages.map((l) => l.lang) ?? [];
  return (
    <Stack gap="lg">
      {note?.(groups.data.pages[0].limit)}
      {items.map((group) => (
        <GroupItem
          key={group.id}
          group={group}
          showIn={showIn}
          profileLangs={profileLangs}
        />
      ))}
      {groups.hasNextPage && (
        <Button
          variant="default"
          onClick={() => groups.fetchNextPage()}
          loading={groups.isFetchingNextPage}
        >
          Load more
        </Button>
      )}
    </Stack>
  );
}
