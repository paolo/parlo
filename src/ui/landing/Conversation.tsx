"use client";

import { Stack, UnstyledButton } from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";
import { type KeyboardEvent, useEffect, useState } from "react";
import { PhraseBubble } from "./PhraseBubble";
import { conversationAt } from "./phrases";
import { useRotation } from "./useRotation";

const FADE_MS = 200;

/** Mandarin is Simplified; everything else is already a valid language tag. */
function htmlLang(code: string) {
  return code === "zh" ? "zh-Hans" : code;
}

export function Conversation() {
  const { step, advance, pauseProps } = useRotation();
  const reducedMotion = useReducedMotion();
  // `shown` lags `step` by one fade so the old bubbles fade out before the new ones fade in.
  const [shown, setShown] = useState(step);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (step === shown) return;
    if (reducedMotion) {
      setShown(step);
      return;
    }
    setVisible(false);
    const id = setTimeout(() => {
      setShown(step);
      setVisible(true);
    }, FADE_MS);
    return () => clearTimeout(id);
  }, [step, shown, reducedMotion]);

  const { set, native } = conversationAt(shown);
  const { phrases } = set;

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      advance();
    }
  }

  return (
    // A div with a button role, because buttons cannot contain the block-level bubbles.
    // The label carries the phrases, since a button's children are not exposed to screen readers.
    <UnstyledButton
      component="div"
      role="button"
      tabIndex={0}
      aria-label={`${set.meaning}: ${phrases[native]}, ${phrases.en}, ${phrases.fr}. Press for another phrase.`}
      onClick={advance}
      onKeyDown={onKeyDown}
      maw={460}
      w="100%"
      mx="auto"
      {...pauseProps}
    >
      <Stack
        gap="sm"
        style={{
          opacity: visible ? 1 : 0,
          transition: reducedMotion ? undefined : `opacity ${FADE_MS}ms ease`,
        }}
      >
        <PhraseBubble
          lang={htmlLang(native)}
          label={native.toUpperCase()}
          text={phrases[native]}
          side="left"
        />
        <PhraseBubble lang="en" label="EN" text={phrases.en} side="right" />
        <PhraseBubble lang="fr" label="FR" text={phrases.fr} side="left" />
      </Stack>
    </UnstyledButton>
  );
}
