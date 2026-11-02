"use client";

import { Alert, Button, Loader } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BUNDLE_LOADERS } from "../../shared/bundles";
import { LANGUAGES, type Lang } from "../../shared/languages";
import { Flag } from "../Flag";
import { bundleToGroups } from "../review/bundles";
import { PracticeRound } from "../review/PracticeRound";
import {
  clearVisitorNative,
  loadVisitorNative,
  saveVisitorNative,
  VISITOR_NATIVES,
  visitorLanguages,
} from "../visitor";
import classes from "./LandingGame.module.css";

const CARDS = 10;

/**
 * A round of Starter cards for someone who has not signed up: pick your language, then flip through ten cards
 * with it up front and English and French behind. It needs no account and makes no request of ours: the deck is
 * static. The pick is remembered, so the signup picker can start from it.
 */
export function LandingGame() {
  // Read after mount so the server and the first client render agree. Undefined until then; null means no pick.
  const [native, setNative] = useState<Lang | null | undefined>();
  const [round, setRound] = useState(0);
  useEffect(() => setNative(loadVisitorNative()), []);
  const starter = useQuery({
    queryKey: ["bundle", "starter"],
    queryFn: () => BUNDLE_LOADERS.starter(),
    staleTime: Number.POSITIVE_INFINITY,
    enabled: Boolean(native),
  });
  const groups = useMemo(
    () =>
      starter.data && native
        ? bundleToGroups(starter.data, [native, "en", "fr"])
        : undefined,
    [starter.data, native],
  );

  if (native === undefined) return <div className={classes.game} />;

  if (native === null) {
    return (
      <section className={classes.game} aria-labelledby="landing-game-title">
        <h2 id="landing-game-title" className={classes.title}>
          Which language feels like home?
        </h2>
        <p className={classes.hint}>
          Pick it and play ten cards. English and French are the other two.
        </p>
        <ul className={classes.pills}>
          {VISITOR_NATIVES.map((lang) => (
            <li key={lang}>
              <button
                type="button"
                className={classes.pill}
                lang={lang}
                onClick={() => {
                  saveVisitorNative(lang);
                  setNative(lang);
                }}
              >
                <Flag region={LANGUAGES[lang].defaultRegion} size="22px" />
                {LANGUAGES[lang].endonym}
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className={classes.game} aria-label="Practice round">
      <Button
        variant="default"
        onClick={() => {
          clearVisitorNative();
          setNative(null);
        }}
      >
        Change language
      </Button>
      {starter.isError && (
        <Alert color="red" title="Couldn't load the cards">
          <Button variant="default" onClick={() => starter.refetch()}>
            Try again
          </Button>
        </Alert>
      )}
      {!groups && !starter.isError && <Loader size="sm" />}
      {groups && (
        <PracticeRound
          key={round}
          groups={groups}
          source="starter"
          count={CARDS}
          practice={native}
          languages={visitorLanguages(native)}
          favorites={false}
          onRestart={() => setRound((r) => r + 1)}
          finishedFooter={
            <div className={classes.invite}>
              <h3 className={classes.inviteTitle}>Liked that?</h3>
              <p className={classes.inviteText}>
                Sign up to play the whole deck, keep phrases in your phrasebook
                and translate your own.
              </p>
              <Button component={Link} href="/sign-in" size="lg" fullWidth>
                Sign up to keep playing
              </Button>
            </div>
          }
        />
      )}
    </section>
  );
}
