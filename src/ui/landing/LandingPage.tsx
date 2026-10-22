"use client";

import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { GoogleSignInButton } from "@/ui/auth/GoogleSignInButton";
import { authClient } from "@/ui/auth-client";
import { Conversation } from "./Conversation";

export function LandingPage() {
  return (
    <Stack mih="100vh" px="md" py="sm" gap={0}>
      <Group justify="space-between" py="xs">
        <Text fw={800} size="xl">
          parlo
        </Text>
        <Button
          variant="subtle"
          color="gray"
          onClick={() =>
            authClient.signIn.social({ provider: "google", callbackURL: "/" })
          }
        >
          Sign in
        </Button>
      </Group>

      <Stack flex={1} justify="center" align="center" gap="xl" py="xl">
        <Stack align="center" gap="xs" ta="center" maw={560}>
          <Title order={1} fz={{ base: 32, sm: 48 }} lh={1.1}>
            Three languages. One meaning.
          </Title>
          <Text c="dimmed" size="lg">
            Understand what people really say, and say what you mean like they
            would.
          </Text>
        </Stack>

        <Conversation />

        <GoogleSignInButton />
      </Stack>
    </Stack>
  );
}
