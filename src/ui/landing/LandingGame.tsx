"use client";

import { Alert, Button, Loader } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BUNDLE_LOADERS } from "../../shared/bundles";
import { CountryPicker } from "../CountryPicker";
import { bundleToGroups } from "../review/bundles";
import { PracticeRound } from "../review/PracticeRound";
import {
  clearVisitorNative,
  loadVisitorNative,
  saveVisitorNative,
  VISITOR_NATIVES,
  type VisitorPick,
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
  const [native, setNative] = useState<VisitorPick | null | undefined>();
  const [round, setRound] = useState(0);
  useEffect(() => setNative(loadVisitorNative()), []);
  // Picking a language (or changing it) swaps the whole section, which would drop keyboard and screen-reader
  // focus onto the page. Move it to the new section instead; not on the first load, which must not steal focus.
  const section = useRef<HTMLElement>(null);
  const settled = useRef(false);
  useEffect(() => {
    if (native === undefined) return;
    if (settled.current) section.current?.focus();
    settled.current = true;
  }, [native]);
  const starter = useQuery({
    queryKey: ["bundle", "starter"],
    queryFn: () => BUNDLE_LOADERS.starter(),
    staleTime: Number.POSITIVE_INFINITY,
    enabled: Boolean(native),
  });
  const groups = useMemo(
    () =>
      starter.data && native
        ? bundleToGroups(starter.data, [native.lang, "en", "fr"])
        : undefined,
    [starter.data, native],
  );

  if (native === undefined) return <div className={classes.game} />;

  if (native === null) {
    return (
      <section
        ref={section}
        tabIndex={-1}
        className={classes.game}
        aria-labelledby="landing-game-title"
      >
        <h2 id="landing-game-title" className={classes.title}>
          Where are you from?
        </h2>
        <p className={classes.hint}>
          Pick your country and play ten cards. English and French are the other
          two languages.
        </p>
        <CountryPicker
          langs={VISITOR_NATIVES}
          onPick={(pick) => {
            saveVisitorNative(pick);
            setNative(pick);
          }}
        />
      </section>
    );
  }

  return (
    <section
      ref={section}
      tabIndex={-1}
      className={classes.game}
      aria-label="Practice round"
    >
      <Button
        variant="default"
        onClick={() => {
          clearVisitorNative();
          setNative(null);
        }}
      >
        Change country
      </Button>
      {starter.isError && (
        <Alert color="red" title="Couldn't load the cards">
          <Button variant="default" onClick={() => starter.refetch()}>
            Try again
          </Button>
        </Alert>
      )}
      {!groups && !starter.isError && (
        <Loader size="sm" aria-label="Loading the cards" />
      )}
      {groups && (
        <PracticeRound
          key={round}
          groups={groups}
          source="starter"
          count={CARDS}
          practice={native.lang}
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
