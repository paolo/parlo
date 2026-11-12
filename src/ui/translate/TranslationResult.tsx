"use client";

import { Badge, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useState } from "react";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import type { Lang } from "../../shared/languages";
import { CorrectionPill } from "../CorrectionPill";
import { FavoriteButton } from "../FavoriteButton";
import { LangLabel } from "../LangLabel";
import { PhraseCard } from "../PhraseCard";
import { orderPhrases } from "../phrases";
import { roleFor } from "../roles";
import { useCorrection } from "../useCorrection";

export function TranslationResult({
  group,
  profileLangs = [],
  layout = "row",
  pending = false,
  unsaved = false,
  animate = false,
}: {
  group: PhraseGroupDTO;
  /** The viewer's languages in profile order; the cards follow it. */
  profileLangs?: Lang[];
  /** "row" puts the cards side by side when there is room; "stack" always one under the other. */
  layout?: "row" | "stack";
  /** The answer is still arriving: `group` is a partial one with no id, so a bookmark tap waits for it. */
  pending?: boolean;
  /** The answer could not be stored: there is nothing to save or correct. */
  unsaved?: boolean;
  /** Animate changes to the typed phrase (a correction landing or switched): the Translate screen only. */
  animate?: boolean;
}) {
  const correction = useCorrection(group);
  const current = correction.shown;
  const phrases = orderPhrases(current.phrases, profileLangs);
  const root = phrases.find((p) => p.isRoot);
  // When the typed phrase's text changes (the stored group replaces the partial one, or the correction is
  // switched), the root card animates from what it showed before.
  const [lastRootText, setLastRootText] = useState(root?.text);
  const [morphFrom, setMorphFrom] = useState<string>();
  if (root?.text !== lastRootText) {
    setLastRootText(root?.text);
    if (animate) setMorphFrom(lastRootText);
  }
  return (
    <Stack>
      <Group justify="space-between" wrap="nowrap">
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
        {/* Not keyed by id: a tap made while the answer streams must survive the stored group arriving. A new
            translation remounts the whole result (TranslateView keys it by request). */}
        {!unsaved && <FavoriteButton group={current} pending={pending} />}
      </Group>
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
            morphFrom={phrase.isRoot ? morphFrom : undefined}
            badge={
              phrase.isRoot && current.correction && !unsaved ? (
                <CorrectionPill
                  correction={current.correction}
                  typed={correction.typed}
                  lang={phrase.lang}
                  applied={correction.applied}
                  onChange={correction.setApplied}
                  busy={correction.busy}
                  animate={animate}
                />
              ) : undefined
            }
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
