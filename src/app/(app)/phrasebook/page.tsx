import { Stack, Text, Title } from "@mantine/core";
import { PhrasebookView } from "@/ui/phrasebook/PhrasebookView";

export default function PhrasebookPage() {
  return (
    <Stack maw={960}>
      <div>
        <Title order={2}>Phrasebook</Title>
        <Text c="dimmed">The phrases you've starred to keep.</Text>
      </div>
      <PhrasebookView />
    </Stack>
  );
}
