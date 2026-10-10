import { Stack, Text, Title } from "@mantine/core";

export default function PhrasebookPage() {
  return (
    <Stack>
      <Title order={2}>Phrasebook</Title>
      <Text c="dimmed">Starred phrases will appear here.</Text>
    </Stack>
  );
}
