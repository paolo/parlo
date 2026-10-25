import { Stack, Text, Title } from "@mantine/core";
import { ProfileGate } from "@/ui/profile/ProfileGate";
import { ReviewView } from "@/ui/review/ReviewView";

export default function ReviewPage() {
  return (
    <ProfileGate>
      <Stack maw={960}>
        <div>
          <Title order={2}>Practice</Title>
          <Text c="dimmed">
            Cards from the phrases you've starred. Read one, try to recall the
            rest, then reveal.
          </Text>
        </div>
        <ReviewView />
      </Stack>
    </ProfileGate>
  );
}
