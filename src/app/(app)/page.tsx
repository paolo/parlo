import { Stack, Text, Title } from "@mantine/core";
import { TranslateView } from "@/ui/translate/TranslateView";

export default function TranslatePage() {
  return (
    <Stack maw={960}>
      <div>
        <Title order={2}>Translate</Title>
        <Text c="dimmed">
          Say it once. Parlo gives it back in Spanish, English and French, the
          way people actually say it.
        </Text>
      </div>
      <TranslateView />
    </Stack>
  );
}
