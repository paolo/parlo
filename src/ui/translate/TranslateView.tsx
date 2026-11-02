"use client";

import { notifications } from "@mantine/notifications";
import { errorMessage } from "../errors";
import { InstallBanner } from "../install/InstallBanner";
import { partialGroup } from "../phrases";
import { useProfile, useTranslate } from "../queries";
import { LanguageStrip } from "./LanguageStrip";
import { TranslateForm } from "./TranslateForm";
import classes from "./TranslateView.module.css";
import { TranslatingPhrase } from "./TranslatingPhrase";
import { TranslationResult } from "./TranslationResult";

/** Two columns from 900px: the phrase on the left, what it really means on the right. One column on a phone. */
export function TranslateView() {
  const translate = useTranslate();
  const profile = useProfile();
  const partial = translate.isPending
    ? partialGroup(translate.variables, translate.progress)
    : null;
  const shown = partial ?? translate.data?.group;

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
    <>
      <div className={classes.grid}>
        <div className={classes.input}>
          {profile.data && (
            <LanguageStrip
              languages={profile.data.languages}
              detected={
                translate.isPending
                  ? translate.progress.detected
                  : translate.data?.group.phrases.find((p) => p.isRoot)?.lang
              }
            />
          )}
          <TranslateForm onSubmit={onSubmit} pending={translate.isPending} />
        </div>
        <div className={classes.output}>
          {translate.isPending && !partial ? (
            <TranslatingPhrase
              text={translate.variables}
              languages={profile.data?.languages ?? []}
            />
          ) : shown ? (
            // Keyed by the request, not the group, so the cards stay put when the stored group replaces the
            // partial one.
            <TranslationResult
              key={translate.submittedAt}
              group={shown}
              pending={partial !== null}
              profileLangs={profile.data?.languages.map((l) => l.lang)}
              layout="stack"
            />
          ) : (
            <p className={classes.empty}>
              Your translations show up here, in your three languages.
            </p>
          )}
        </div>
      </div>
      <InstallBanner />
    </>
  );
}
