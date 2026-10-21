"use client";

import { Button, Group, Kbd, Stack, Text, Textarea } from "@mantine/core";
import { type FormEvent, type KeyboardEvent, useState } from "react";

export const MAX_PHRASE_LENGTH = 500;

export function TranslateForm({
  onSubmit,
  pending,
}: {
  onSubmit: (text: string) => void;
  pending: boolean;
}) {
  const [text, setText] = useState("");
  const canSubmit = !pending && text.trim().length > 0;

  function submit() {
    if (canSubmit) onSubmit(text.trim());
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      submit();
    }
  }

  function onFormSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  return (
    <form onSubmit={onFormSubmit}>
      <Stack gap="xs">
        <Textarea
          aria-label="Phrase to translate"
          placeholder="Type a phrase in any of your languages…"
          autosize
          minRows={3}
          maxRows={8}
          maxLength={MAX_PHRASE_LENGTH}
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          onKeyDown={onKeyDown}
          autoFocus
        />
        <Group justify="space-between">
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              {`${text.length}/${MAX_PHRASE_LENGTH}`}
            </Text>
            <Text size="xs" c="dimmed" visibleFrom="sm">
              <Kbd size="xs">Ctrl</Kbd> + <Kbd size="xs">Enter</Kbd>
            </Text>
          </Group>
          <Button type="submit" loading={pending} disabled={!canSubmit}>
            Translate
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
