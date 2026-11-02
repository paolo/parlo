"use client";

import { Alert, Center, Loader, Stack, Text, Title } from "@mantine/core";
import { type ReactNode, useEffect, useState } from "react";
import { type Lang, PROFILE_SIZE } from "../../shared/languages";
import { errorMessage } from "../errors";
import { useProfile } from "../queries";
import {
  clearVisitorNative,
  loadVisitorNative,
  visitorLanguages,
} from "../visitor";
import { LanguagePicker } from "./LanguagePicker";

/**
 * Shows the page once the user has picked their languages; until then, the picker. A native language picked on
 * the landing page before signing up arrives pre-filled, with English (Canada) and French (France) after it.
 */
export function ProfileGate({ children }: { children: ReactNode }) {
  const profile = useProfile();
  // Read after mount, so the server and the first client render agree. Undefined until then.
  const [visitorNative, setVisitorNative] = useState<Lang | null | undefined>();
  useEffect(() => setVisitorNative(loadVisitorNative()), []);
  const complete = profile.data?.languages.length === PROFILE_SIZE;
  // Once there is a profile the pick has done its job, whether it was just saved or already existed.
  useEffect(() => {
    if (complete) clearVisitorNative();
  }, [complete]);

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
    if (visitorNative === undefined) {
      return (
        <Center h="50vh">
          <Loader aria-label="Loading your profile" />
        </Center>
      );
    }
    return (
      <Stack>
        <div>
          <Title order={2}>Pick your languages</Title>
          <Text c="dimmed">
            Start with the language you speak best: Parlo explains and corrects
            in it. Then choose two more.
          </Text>
        </div>
        <LanguagePicker
          initial={visitorNative ? visitorLanguages(visitorNative) : undefined}
        />
      </Stack>
    );
  }
  return <>{children}</>;
}
