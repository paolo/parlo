"use client";

import {
  ActionIcon,
  Badge,
  CopyButton,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import type { PhraseDTO } from "@/server/phrases/types";
import { LANG_FLAGS, LANG_LABELS } from "./langs";

export function PhraseCard({ phrase }: { phrase: PhraseDTO }) {
  return (
    <Paper
      withBorder
      p="md"
      bg={phrase.isRoot ? "var(--mantine-primary-color-light)" : undefined}
    >
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <Text size="sm" fw={600}>
              {LANG_FLAGS[phrase.lang]} {LANG_LABELS[phrase.lang]}
            </Text>
            {phrase.isRoot && (
              <Badge size="xs" variant="light">
                Original
              </Badge>
            )}
          </Group>
          <CopyButton value={phrase.text}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? "Copied" : "Copy"} withArrow>
                <ActionIcon
                  variant="subtle"
                  color={copied ? "teal" : "gray"}
                  onClick={copy}
                  aria-label="Copy phrase"
                >
                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </Group>
        <Text size="lg">{phrase.text}</Text>
      </Stack>
    </Paper>
  );
}
