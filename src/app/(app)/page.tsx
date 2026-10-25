import { Stack, Text, Title } from "@mantine/core";
import { ProfileGate } from "@/ui/profile/ProfileGate";
import { TranslateView } from "@/ui/translate/TranslateView";

export default function TranslatePage() {
  return (
    <ProfileGate>
      <Stack>
        <div>
          <Title order={2}>Translate</Title>
          <Text c="dimmed">
            Say it once. Parlo gives it back in your three languages, the way
            people actually say it.
          </Text>
        </div>
        <TranslateView />
      </Stack>
    </ProfileGate>
  );
}
