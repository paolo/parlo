"use client";

import {
  Button,
  CloseButton,
  Group,
  Kbd,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { type FormEvent, type KeyboardEvent, useRef, useState } from "react";
import { useIsMac } from "../platform";

export const MAX_PHRASE_LENGTH = 500;

export function TranslateForm({
  onSubmit,
  pending,
}: {
  onSubmit: (text: string) => void;
  pending: boolean;
}) {
  const [text, setText] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const isMac = useIsMac();
  const canSubmit = !pending && text.trim().length > 0;

  function submit() {
    if (canSubmit) onSubmit(text.trim());
  }

  function clear() {
    setText("");
    textarea.current?.focus();
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
          ref={textarea}
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
          rightSectionWidth={44}
          rightSection={
            text.length > 0 ? (
              <CloseButton size={44} aria-label="Clear" onClick={clear} />
            ) : null
          }
          styles={{ section: { alignItems: "flex-start" } }}
        />
        <Group justify="space-between">
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              {`${text.length}/${MAX_PHRASE_LENGTH}`}
            </Text>
            <Text size="xs" c="dimmed" visibleFrom="sm">
              <Kbd size="xs">{isMac ? "⌘" : "Ctrl"}</Kbd> +{" "}
              <Kbd size="xs">Enter</Kbd>
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
