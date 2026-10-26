"use client";

import { notifications } from "@mantine/notifications";
import { errorMessage } from "../errors";
import { InstallBanner } from "../install/InstallBanner";
import { useProfile, useTranslate } from "../queries";
import { LanguageStrip } from "./LanguageStrip";
import { TranslateForm } from "./TranslateForm";
import classes from "./TranslateView.module.css";
import { TranslationResult } from "./TranslationResult";

/** Two columns from 900px: the phrase on the left, what it really means on the right. One column on a phone. */
export function TranslateView() {
  const translate = useTranslate();
  const profile = useProfile();

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
                translate.data?.group.phrases.find((p) => p.isRoot)?.lang
              }
            />
          )}
          <TranslateForm onSubmit={onSubmit} pending={translate.isPending} />
        </div>
        <div className={classes.output}>
          {translate.data ? (
            <TranslationResult
              key={translate.data.group.id}
              group={translate.data.group}
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
