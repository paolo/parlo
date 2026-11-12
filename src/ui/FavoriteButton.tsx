"use client";

import { ActionIcon, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBookmark, IconBookmarkFilled } from "@tabler/icons-react";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import { errorMessage } from "./errors";
import { useSetFavorite } from "./queries";

/** Saves or un-saves a whole phrase group, which adds it to or removes it from the phrasebook. */
export function FavoriteButton({ group }: { group: PhraseGroupDTO }) {
  const setFavorite = useSetFavorite();
  // Show the requested state while saving, then the saved one.
  const isFavorite = setFavorite.isPending
    ? setFavorite.variables.isFavorite
    : (setFavorite.data?.group.isFavorite ?? group.isFavorite);
  const label = isFavorite ? "Remove from saved" : "Save";

  function toggle() {
    setFavorite.mutate(
      { id: group.id, isFavorite: !isFavorite },
      {
        onError: (error) =>
          notifications.show({
            color: "red",
            title: "Couldn't update your saved phrases",
            message: errorMessage(error),
          }),
      },
    );
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
