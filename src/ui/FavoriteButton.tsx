"use client";

import { ActionIcon, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconStar, IconStarFilled } from "@tabler/icons-react";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import { errorMessage } from "./errors";
import { useSetFavorite } from "./queries";

/** Favorites or unfavorites a whole phrase group, which adds it to or removes it from the phrasebook. */
export function FavoriteButton({ group }: { group: PhraseGroupDTO }) {
  const setFavorite = useSetFavorite();
  // Show the requested state while saving, then the saved one.
  const isFavorite = setFavorite.isPending
    ? setFavorite.variables.isFavorite
    : (setFavorite.data?.group.isFavorite ?? group.isFavorite);
  const label = isFavorite ? "Remove from phrasebook" : "Add to phrasebook";

  function toggle() {
    setFavorite.mutate(
      { id: group.id, isFavorite: !isFavorite },
      {
        onError: (error) =>
          notifications.show({
            color: "red",
            title: "Couldn't update your phrasebook",
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
      >
        {isFavorite ? (
          <IconStarFilled size={20} />
        ) : (
          <IconStar size={20} stroke={1.8} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}
