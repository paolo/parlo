"use client";

import { Badge, Button, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBulb, IconInfoCircle } from "@tabler/icons-react";
import { useState } from "react";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import type { Lang } from "../../shared/languages";
import { CorrectionAlert } from "../CorrectionAlert";
import { errorMessage } from "../errors";
import { FavoriteButton } from "../FavoriteButton";
import { LangLabel } from "../LangLabel";
import { PhraseCard } from "../PhraseCard";
import { orderPhrases } from "../phrases";
import { useAcceptCorrection } from "../queries";
import { roleFor } from "../roles";

export function TranslationResult({
  group,
  profileLangs = [],
  layout = "row",
}: {
  group: PhraseGroupDTO;
  /** The viewer's languages in profile order; the cards follow it. */
  profileLangs?: Lang[];
  /** "row" puts the cards side by side when there is room; "stack" always one under the other. */
  layout?: "row" | "stack";
}) {
  const accept = useAcceptCorrection();
  // Null until the user chooses: a suggestion not yet applied is shown, an applied one stays out of the way.
  const [correctionShown, setCorrectionShown] = useState<boolean | null>(null);
  // Show the saved state once accepted, but only for the group that was accepted.
  const current =
    accept.data?.group.id === group.id ? accept.data.group : group;
  const phrases = orderPhrases(current.phrases, profileLangs);
  const root = phrases.find((p) => p.isRoot);
  const showCorrection =
    correctionShown ??
    (current.correction ? !current.correction.accepted : false);
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
        <Group gap="xs">
          {root && current.correction && !showCorrection && (
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconBulb size={18} stroke={1.8} />}
              onClick={() => setCorrectionShown(true)}
            >
              Show correction
            </Button>
          )}
          {/* Keyed so a new translation doesn't inherit the previous one's star. */}
          <FavoriteButton key={group.id} group={current} />
        </Group>
      </Group>
      {root && current.correction && showCorrection && (
        <CorrectionAlert
          original={root.correctedFrom ?? root.text}
          correction={current.correction}
          onClose={() => setCorrectionShown(false)}
          onAccept={() =>
            accept.mutate(current.id, {
              // Once applied the box has done its job: tuck it away (it can be shown again).
              onSuccess: () => setCorrectionShown(false),
              onError: (error) =>
                notifications.show({
                  color: "red",
                  title: "Couldn't apply the correction",
                  message: errorMessage(error),
                }),
            })
          }
          accepting={accept.isPending}
        />
      )}
      <SimpleGrid
        cols={
          layout === "stack"
            ? 1
            : { base: 1, sm: Math.min(phrases.length, 3) || 1 }
        }
      >
        {phrases.map((phrase, index) => (
          <PhraseCard
            key={phrase.lang}
            phrase={phrase}
            langRole={roleFor(phrase.lang, profileLangs)}
            index={index}
          />
        ))}
      </SimpleGrid>
      {current.notes && (
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <IconInfoCircle size={18} color="var(--mantine-color-dimmed)" />
          <Text size="sm" c="dimmed">
            {current.notes}
          </Text>
        </Group>
      )}
    </Stack>
  );
}
