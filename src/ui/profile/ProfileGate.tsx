"use client";

import { Alert, Center, Loader, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { PROFILE_SIZE } from "../../shared/languages";
import { errorMessage } from "../errors";
import { useProfile } from "../queries";
import { LanguagePicker } from "./LanguagePicker";

/** Shows the page once the user has picked their languages; until then, the picker. */
export function ProfileGate({ children }: { children: ReactNode }) {
  const profile = useProfile();

  if (profile.isPending) {
    return (
      <Center h="50vh">
        <Loader aria-label="Loading your profile" />
      </Center>
    );
  }
  if (profile.isError) {
    return (
      <Alert color="red" title="Couldn't load your profile">
        {errorMessage(profile.error)}
      </Alert>
    );
  }
  if (profile.data.languages.length !== PROFILE_SIZE) {
    return (
      <Stack>
        <div>
          <Title order={2}>Pick your languages</Title>
          <Text c="dimmed">
            Start with the language you speak best: Parlo explains and corrects
            in it. Then choose two more.
          </Text>
        </div>
        <LanguagePicker />
      </Stack>
    );
  }
  return <>{children}</>;
}
