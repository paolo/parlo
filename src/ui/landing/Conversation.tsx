"use client";

import { Stack, UnstyledButton } from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";
import { type KeyboardEvent, useEffect, useState } from "react";
import { LANGUAGES, type Lang, regionName } from "@/shared/languages";
import { PhraseBubble, SLIDE_MS } from "./PhraseBubble";
import { conversationAt } from "./phrases";
import { useRotation } from "./useRotation";

/** Mandarin is Simplified; everything else is already a valid language tag. */
function htmlLang(code: string) {
  return code === "zh" ? "zh-Hans" : code;
}

/** The flag and its spoken name for a language as spoken in a country, e.g. Spanish in Bolivia. */
function flagFor(lang: Lang, region: string) {
  return {
    region,
    flagName: `${LANGUAGES[lang].name} (${regionName(region)})`,
  };
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
    }, SLIDE_MS);
    return () => clearTimeout(id);
  }, [step, shown, reducedMotion]);

  const { set, native, region } = conversationAt(shown);
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
      // Bubbles slide past the column's edge; clipping keeps that from widening the page.
      style={{ overflowX: "clip" }}
      {...pauseProps}
    >
      <Stack gap="sm">
        <PhraseBubble
          lang={htmlLang(native)}
          {...flagFor(native, region)}
          text={phrases[native]}
          side="left"
          exited={!visible}
        />
        <PhraseBubble
          lang="en"
          {...flagFor("en", LANGUAGES.en.defaultRegion)}
          text={phrases.en}
          side="right"
          exited={!visible}
        />
        <PhraseBubble
          lang="fr"
          {...flagFor("fr", LANGUAGES.fr.defaultRegion)}
          text={phrases.fr}
          side="left"
          exited={!visible}
        />
      </Stack>
    </UnstyledButton>
  );
}
