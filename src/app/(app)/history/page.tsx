import { Stack, Text, Title } from "@mantine/core";
import { HistoryView } from "@/ui/history/HistoryView";
import { ProfileGate } from "@/ui/profile/ProfileGate";

export default function HistoryPage() {
  return (
    <ProfileGate>
      <Stack>
        <div>
          <Title order={2}>History</Title>
          <Text c="dimmed">Everything you've translated, newest first.</Text>
        </div>
        <HistoryView />
      </Stack>
    </ProfileGate>
  );
}
