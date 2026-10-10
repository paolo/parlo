"use client";

import { Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { errorMessage } from "../errors";
import { useTranslate } from "../queries";
import { TranslateForm } from "./TranslateForm";
import { TranslationResult } from "./TranslationResult";

export function TranslateView() {
  const translate = useTranslate();

  function onSubmit(text: string) {
    translate.mutate(text, {
      onError: (error) =>
        notifications.show({
          color: "red",
          title: "Couldn't translate",
          message: errorMessage(error),
        }),
    });
  }

  return (
    <Stack gap="lg">
      <TranslateForm onSubmit={onSubmit} pending={translate.isPending} />
      {translate.data && <TranslationResult group={translate.data.group} />}
    </Stack>
  );
}
