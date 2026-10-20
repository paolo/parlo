"use client";

import { Alert, Button, Divider, Loader, Stack, Text } from "@mantine/core";
import Link from "next/link";
import { Fragment } from "react";
import { errorMessage } from "../errors";
import { useFavorites } from "../queries";
import { TranslationResult } from "../translate/TranslationResult";

export function PhrasebookView() {
  const favorites = useFavorites();

  if (favorites.isPending) return <Loader size="sm" />;
  if (favorites.isError) {
    return (
      <Alert color="red" title="Couldn't load your phrasebook">
        {errorMessage(favorites.error)}
      </Alert>
    );
  }
  if (favorites.data.items.length === 0) {
    return (
      <Stack align="flex-start" gap="xs">
        <Text c="dimmed">
          You haven't starred anything yet. Star a translation to keep it here.
        </Text>
        <Button component={Link} href="/" variant="light">
          Go to Translate
        </Button>
      </Stack>
    );
  }
  return (
    <Stack gap="lg">
      {favorites.data.items.map((group, i) => (
        <Fragment key={group.id}>
          {i > 0 && <Divider />}
          <TranslationResult group={group} />
        </Fragment>
      ))}
    </Stack>
  );
}
