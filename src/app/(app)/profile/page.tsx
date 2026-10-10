import { Stack, Text, Title } from "@mantine/core";

export default function ProfilePage() {
  return (
    <Stack>
      <Title order={2}>Profile</Title>
      <Text c="dimmed">Set your level in each language.</Text>
    </Stack>
  );
}
