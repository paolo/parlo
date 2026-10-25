"use client";

import { Button, CloseButton, Kbd, Textarea } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { type FormEvent, type KeyboardEvent, useRef, useState } from "react";
import { useIsMac } from "../platform";
import classes from "./TranslateForm.module.css";

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
      <section className={classes.card}>
        <span className={classes.caption} aria-hidden="true">
          Say it like you would at home
        </span>
        <Textarea
          ref={textarea}
          aria-label="Phrase to translate"
          placeholder="Type a phrase in any of your languages…"
          variant="unstyled"
          classNames={{ input: classes.input, section: classes.section }}
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
        />
        <div className={classes.footer}>
          <div className={classes.hints}>
            <span>{`${text.length}/${MAX_PHRASE_LENGTH}`}</span>
            <span className={classes.shortcut}>
              <Kbd size="xs">{isMac ? "⌘" : "Ctrl"}</Kbd> +{" "}
              <Kbd size="xs">Enter</Kbd>
            </span>
          </div>
          <Button
            type="submit"
            loading={pending}
            disabled={!canSubmit}
            rightSection={<IconArrowRight size={18} stroke={2} />}
          >
            Translate
          </Button>
        </div>
      </section>
    </form>
  );
}
