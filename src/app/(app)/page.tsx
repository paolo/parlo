import { Stack, Text, Title } from "@mantine/core";

export default function TranslatePage() {
  return (
    <Stack>
      <Title order={2}>Translate</Title>
      <Text c="dimmed">Type a phrase in Spanish, English or French.</Text>
    </Stack>
  );
}
