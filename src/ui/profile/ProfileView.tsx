"use client";

import {
  Alert,
  Avatar,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { authClient } from "@/ui/auth-client";
import { errorMessage } from "../errors";
import { useProfile } from "../queries";
import { signOut } from "../signOut";
import { LanguagePicker } from "./LanguagePicker";
import { ThemeSetting } from "./ThemeSetting";

export function ProfileView() {
  const profile = useProfile();
  const user = authClient.useSession().data?.user;

  if (profile.isPending) return <Loader size="sm" />;
  if (profile.isError) {
    return (
      <Alert color="red" title="Couldn't load your profile">
        {errorMessage(profile.error)}
      </Alert>
    );
  }
  return (
    <Stack maw={720} gap="lg">
      <Group gap="md" wrap="nowrap">
        <Avatar
          src={user?.image}
          name={user?.name}
          color="initials"
          radius="xl"
          size={60}
        />
        <div>
          <Title order={2}>{user?.name ?? "Profile"}</Title>
          {user?.email && <Text c="dimmed">{user.email}</Text>}
        </div>
      </Group>
      <div>
        <Title order={3}>Your languages</Title>
        <Text c="dimmed">
          Parlo translates between these three and explains and corrects in the
          first one. The regions help it understand how you speak.
        </Text>
      </div>
      <LanguagePicker
        initial={profile.data.languages}
        onSaved={() =>
          notifications.show({ color: "french", message: "Languages saved" })
        }
      />
      <Text size="sm" c="dimmed">
        Levels per language are coming next.
      </Text>
      <ThemeSetting />
      <Button variant="default" onClick={signOut} w="fit-content">
        Sign out
      </Button>
    </Stack>
  );
}
