"use client";

import { Alert, Button, Group, Stack, Text } from "@mantine/core";
import { IconBulb } from "@tabler/icons-react";
import type { PhraseGroupDTO } from "@/server/phrases/types";

type Correction = NonNullable<PhraseGroupDTO["correction"]>;

export function CorrectionAlert({
  original,
  correction,
  onAccept,
  accepting = false,
}: {
  original: string;
  correction: Correction;
  onAccept?: () => void;
  accepting?: boolean;
}) {
  return (
    <Alert
      color="yellow"
      variant="light"
      icon={<IconBulb />}
      title="This could sound more natural"
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
            <Button
              size="xs"
              variant="light"
              color="yellow"
              onClick={onAccept}
              loading={accepting}
            >
              Use corrected
            </Button>
          </Group>
        )}
      </Stack>
    </Alert>
  );
}
