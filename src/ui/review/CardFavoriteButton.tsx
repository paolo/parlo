"use client";

import { ActionIcon } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconStar, IconStarFilled } from "@tabler/icons-react";
import { errorMessage } from "../errors";
import {
  useAllFavorites,
  useSetBundleFavorite,
  useSetFavorite,
} from "../queries";
import classes from "./PracticeDeck.module.css";
import type { ReviewCard } from "./session";

/**
 * Favorites or un-favorites the phrase on a Practice card. The star reads the user's favorites, so it is right
 * on a card from any source and in any later round; it never touches the round's cards, which are fixed when
 * the round starts. A card from a bundle (or saved from one) goes through the bundle routes, which save the
 * phrase the first time and remove that copy when un-favorited.
 */
export function CardFavoriteButton({ card }: { card: ReviewCard }) {
  const favorites = useAllFavorites();
  const setFavorite = useSetFavorite();
  const setBundleFavorite = useSetBundleFavorite();
  const saved =
    favorites.data?.items.some(
      (g) =>
        g.id === card.id ||
        (card.bundleRef !== null && g.bundleRef === card.bundleRef),
    ) ?? false;
  // Show the requested state while saving, then the saved one.
  const pending = setBundleFavorite.isPending
    ? setBundleFavorite.variables.isFavorite
    : setFavorite.isPending
      ? setFavorite.variables.isFavorite
      : null;
  const isFavorite = pending ?? saved;
  const label = isFavorite ? "Remove from favorites" : "Add to favorites";

  function toggle() {
    const options = {
      onError: (error: unknown) =>
        notifications.show({
          color: "red",
          title: "Couldn't update your favorites",
          message: errorMessage(error),
        }),
    };
    if (card.bundleRef !== null) {
      setBundleFavorite.mutate(
        { bundleRef: card.bundleRef, isFavorite: !isFavorite },
        options,
      );
    } else {
      setFavorite.mutate({ id: card.id, isFavorite: !isFavorite }, options);
    }
  }

  return (
    <ActionIcon
      className={classes.star}
      size={44}
      radius="xl"
      variant="transparent"
      onClick={toggle}
      disabled={pending !== null}
      aria-label={label}
    >
      {isFavorite ? (
        <IconStarFilled size={22} />
      ) : (
        <IconStar size={22} stroke={1.8} />
      )}
    </ActionIcon>
  );
}
