import { Stack, Text, Title } from "@mantine/core";

export default function HistoryPage() {
  return (
    <Stack>
      <Title order={2}>History</Title>
      <Text c="dimmed">Your past translations will appear here.</Text>
    </Stack>
  );
}
