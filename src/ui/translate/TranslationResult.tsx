"use client";

import { Badge, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import type { Lang } from "../../shared/languages";
import { CorrectionAlert } from "../CorrectionAlert";
import { FavoriteButton } from "../FavoriteButton";
import { LangLabel } from "../LangLabel";
import { PhraseCard } from "../PhraseCard";
import { orderPhrases } from "../phrases";

export function TranslationResult({
  group,
  profileLangs = [],
}: {
  group: PhraseGroupDTO;
  /** The viewer's languages in profile order; the cards follow it. */
  profileLangs?: Lang[];
}) {
  const phrases = orderPhrases(group.phrases, profileLangs);
  const root = phrases.find((p) => p.isRoot);
  return (
    <Stack>
      <Group justify="space-between">
        {root ? (
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Detected
            </Text>
            <Badge variant="outline">
              <LangLabel lang={root.lang} />
            </Badge>
          </Group>
        ) : (
          <span />
        )}
        {/* Keyed so a new translation doesn't inherit the previous one's star. */}
        <FavoriteButton key={group.id} group={group} />
      </Group>
      {root && group.correction && (
        <CorrectionAlert
          original={root.correctedFrom ?? root.text}
          correction={group.correction}
        />
      )}
      <SimpleGrid cols={{ base: 1, sm: Math.min(phrases.length, 3) || 1 }}>
        {phrases.map((phrase) => (
          <PhraseCard key={phrase.lang} phrase={phrase} />
        ))}
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
