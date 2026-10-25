"use client";

import { Alert, Button, Group, Stack, Text } from "@mantine/core";
import { IconBulb } from "@tabler/icons-react";
import type { PhraseGroupDTO } from "@/server/phrases/types";

type Correction = NonNullable<PhraseGroupDTO["correction"]>;

export function CorrectionAlert({
  original,
  correction,
  onAccept,
  onClose,
  accepting = false,
}: {
  original: string;
  correction: Correction;
  onAccept?: () => void;
  /** Hides the alert; without it there is no close button. */
  onClose?: () => void;
  accepting?: boolean;
}) {
  return (
    <Alert
      variant="default"
      radius="sm"
      icon={<IconBulb stroke={1.8} />}
      withCloseButton={onClose !== undefined}
      onClose={onClose}
      closeButtonLabel="Hide correction"
      styles={{ closeButton: { "--cb-size": "44px" } }}
      title={
        correction.accepted
          ? "Correction applied"
          : "This could sound more natural"
      }
    >
      <Stack gap="xs">
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" c="dimmed" td="line-through">
            {original}
          </Text>
        </Group>
        <Text fw={600}>{correction.text}</Text>
        <Text size="sm">{correction.explanation}</Text>
        {onAccept && !correction.accepted && (
          <Group>
            <Button variant="outline" onClick={onAccept} loading={accepting}>
              Use corrected
            </Button>
          </Group>
        )}
      </Stack>
    </Alert>
  );
}
