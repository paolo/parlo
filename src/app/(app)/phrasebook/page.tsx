import { Stack, Text, Title } from "@mantine/core";
import { PhrasebookView } from "@/ui/phrasebook/PhrasebookView";
import { ProfileGate } from "@/ui/profile/ProfileGate";

export default function PhrasebookPage() {
  return (
    <ProfileGate>
      <Stack>
        <div>
          <Title order={2}>Phrasebook</Title>
          <Text c="dimmed">
            Your favorite phrases, to keep and practice. All shows everything
            you've translated.
          </Text>
        </div>
        <PhrasebookView />
      </Stack>
    </ProfileGate>
  );
}
