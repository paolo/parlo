"use client";

import { Alert, List, Stack, Text, Title } from "@mantine/core";
import { IconRoad } from "@tabler/icons-react";

/** A clearly-labelled placeholder for a section that is designed but not built yet. */
export function ComingNext({
  title,
  intro,
  items,
}: {
  title: string;
  intro: string;
  items: string[];
}) {
  return (
    <Stack maw={720}>
      <Title order={2}>{title}</Title>
      <Alert
        variant="light"
        color="indigo"
        icon={<IconRoad />}
        title="Coming next"
      >
        <Stack gap="xs">
          <Text size="sm">{intro}</Text>
          <List size="sm" spacing={4}>
            {items.map((item) => (
              <List.Item key={item}>{item}</List.Item>
            ))}
          </List>
        </Stack>
      </Alert>
    </Stack>
  );
}
