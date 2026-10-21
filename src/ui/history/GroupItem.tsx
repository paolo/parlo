"use client";

import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconTrash } from "@tabler/icons-react";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import { LANGUAGES, type Lang } from "../../shared/languages";
import { errorMessage } from "../errors";
import { FavoriteButton } from "../FavoriteButton";
import { PhraseCard } from "../PhraseCard";
import { pickPhrase } from "../phrases";
import { useDeleteGroup } from "../queries";
import { TranslationResult } from "../translate/TranslationResult";
import type { ShowIn } from "./ShowInSelect";

export function GroupItem({
  group,
  showIn,
  profileLangs,
}: {
  group: PhraseGroupDTO;
  showIn: ShowIn;
  profileLangs: Lang[];
}) {
  const [confirming, { open, close }] = useDisclosure();
  const remove = useDeleteGroup();

  function confirmDelete() {
    remove.mutate(group.id, {
      onSuccess: close,
      onError: (error) =>
        notifications.show({
          color: "red",
          title: "Couldn't delete the phrase",
          message: errorMessage(error),
        }),
    });
  }

  const single = showIn === "all" ? null : pickPhrase(group, showIn);
  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {new Date(group.createdAt).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </Text>
          <Tooltip label="Delete" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={open}
              aria-label="Delete phrase"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
        {single && showIn !== "all" ? (
          <Stack gap="xs">
            <PhraseCard phrase={single.phrase} />
            {single.fallback && (
              <Text size="sm" c="dimmed">
                No {LANGUAGES[showIn].endonym} version, showing the original.
              </Text>
            )}
            <Group>
              <FavoriteButton group={group} />
            </Group>
          </Stack>
        ) : (
          <TranslationResult group={group} profileLangs={profileLangs} />
        )}
      </Stack>
      <Modal opened={confirming} onClose={close} title="Delete this phrase?">
        <Stack>
          <Text size="sm">
            It disappears from your history and your phrasebook. Your daily
            translations are not given back.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={confirmDelete}
              loading={remove.isPending}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
