"use client";

import { ActionIcon, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBookmark, IconBookmarkFilled } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import { errorMessage } from "./errors";
import { useSetFavorite } from "./queries";

/**
 * Saves or un-saves a whole phrase group, which adds it to or removes it from the phrasebook. While the answer is
 * still arriving (`pending`, the group has no id yet) a tap is only remembered and shown; once the stored group
 * arrives, the remembered choice is sent if it differs from the stored one.
 */
export function FavoriteButton({
  group,
  pending = false,
}: {
  group: PhraseGroupDTO;
  pending?: boolean;
}) {
  const setFavorite = useSetFavorite();
  // What the user asked for before the group was stored; null when they have not tapped.
  const [wanted, setWanted] = useState<boolean | null>(null);
  // Show the requested state while saving, then the saved one.
  const isFavorite = setFavorite.isPending
    ? setFavorite.variables.isFavorite
    : (wanted ?? setFavorite.data?.group.isFavorite ?? group.isFavorite);
  const label = isFavorite ? "Remove from saved" : "Save";

  function save(id: string, next: boolean) {
    setFavorite.mutate(
      { id, isFavorite: next },
      {
        // A remembered tap stays shown until its request settles, so the bookmark never flickers back.
        onSettled: () => setWanted(null),
        onError: (error) =>
          notifications.show({
            color: "red",
            title: "Couldn't update your saved phrases",
            message: errorMessage(error),
          }),
      },
    );
  }

  // The stored group has arrived: send what was tapped while it streamed, once.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs only when the answer stops pending
  useEffect(() => {
    if (pending || wanted === null) return;
    if (wanted === group.isFavorite) setWanted(null);
    else save(group.id, wanted);
  }, [pending]);

  function toggle() {
    if (pending) setWanted(!isFavorite);
    else save(group.id, !isFavorite);
  }

  return (
    <Tooltip label={label} withArrow>
      <ActionIcon
        variant="subtle"
        color={isFavorite ? "native" : "gray"}
        onClick={toggle}
        disabled={setFavorite.isPending}
        aria-label={label}
        data-saved={isFavorite}
      >
        {isFavorite ? (
          <IconBookmarkFilled size={20} />
        ) : (
          <IconBookmark size={20} stroke={1.8} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}
