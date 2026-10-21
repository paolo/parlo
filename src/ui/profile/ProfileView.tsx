"use client";

import { Alert, Loader, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { errorMessage } from "../errors";
import { useProfile } from "../queries";
import { LanguagePicker } from "./LanguagePicker";

export function ProfileView() {
  const profile = useProfile();

  if (profile.isPending) return <Loader size="sm" />;
  if (profile.isError) {
    return (
      <Alert color="red" title="Couldn't load your profile">
        {errorMessage(profile.error)}
      </Alert>
    );
  }
  return (
    <Stack maw={720}>
      <div>
        <Title order={2}>Your languages</Title>
        <Text c="dimmed">
          Parlo translates between these three and explains and corrects in the
          first one. The regions help it understand how you speak.
        </Text>
      </div>
      <LanguagePicker
        initial={profile.data.languages}
        onSaved={() =>
          notifications.show({ color: "teal", message: "Languages saved" })
        }
      />
      <Text size="sm" c="dimmed">
        Levels per language are coming next.
      </Text>
    </Stack>
  );
}
