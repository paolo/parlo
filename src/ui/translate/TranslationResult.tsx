"use client";

import { Badge, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import { CorrectionAlert } from "../CorrectionAlert";
import { LANG_FLAGS, LANG_LABELS, LANG_ORDER } from "../langs";
import { PhraseCard } from "../PhraseCard";

export function TranslationResult({ group }: { group: PhraseGroupDTO }) {
  const root = LANG_ORDER.map((lang) => group.phrases[lang]).find(
    (p) => p?.isRoot,
  );
  return (
    <Stack>
      {root && (
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            Detected
          </Text>
          <Badge variant="outline">
            {LANG_FLAGS[root.lang]} {LANG_LABELS[root.lang]}
          </Badge>
        </Group>
      )}
      {root && group.correction && (
        <CorrectionAlert
          original={root.correctedFrom ?? root.text}
          correction={group.correction}
        />
      )}
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        {LANG_ORDER.map(
          (lang) =>
            group.phrases[lang] && (
              <PhraseCard key={lang} phrase={group.phrases[lang]} />
            ),
        )}
      </SimpleGrid>
      {group.notes && (
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <IconInfoCircle size={18} color="var(--mantine-color-dimmed)" />
          <Text size="sm" c="dimmed">
            {group.notes}
          </Text>
        </Group>
      )}
    </Stack>
  );
}
