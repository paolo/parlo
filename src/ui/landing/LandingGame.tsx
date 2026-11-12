"use client";

import { Alert, Button, Loader } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BUNDLE_LOADERS } from "../../shared/bundles";
import { LANGUAGES, type Lang, regionName } from "../../shared/languages";
import { Flag } from "../Flag";
import { bundleToGroups } from "../review/bundles";
import { PracticeRound } from "../review/PracticeRound";
import {
  clearVisitorNative,
  loadVisitorNative,
  saveVisitorNative,
  VISITOR_ALSO,
  VISITOR_NATIVES,
  type VisitorPick,
  visitorLanguages,
} from "../visitor";
import classes from "./LandingGame.module.css";

const CARDS = 5;

/**
 * The flags previewed on a language's card, where they should differ from the first four countries of its list.
 * Spanish shows Bolivia instead of Argentina, since a Bolivian is among the people this is for.
 */
const PREVIEW_REGIONS: Partial<Record<Lang, readonly string[]>> = {
  es: ["ES", "MX", "CO", "BO"],
};

const byCountryName = (a: string, b: string) =>
  regionName(a).localeCompare(regionName(b));

/**
 * A round of Starter cards for someone who has not signed up: pick your language, then flip through five cards
 * with it up front and English and French behind. It needs no account and makes no request of ours: the deck is
 * static. The pick is remembered, so the signup picker can start from it.
 */
export function LandingGame() {
  // Read after mount so the server and the first client render agree. Undefined until then; null means no pick.
  const [native, setNative] = useState<VisitorPick | null | undefined>();
  const [round, setRound] = useState(0);
  // The language whose countries are showing, and the country picked among them (the first until changed).
  const [chosen, setChosen] = useState<Lang | null>(null);
  const [region, setRegion] = useState("");
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
        ? bundleToGroups(
            starter.data,
            visitorLanguages(native).map((l) => l.lang),
          )
        : undefined,
    [starter.data, native],
  );

  function start(pick: VisitorPick) {
    saveVisitorNative(pick);
    setChosen(null);
    setNative(pick);
  }

  function languageCard(lang: Lang) {
    const { name, endonym, regions } = LANGUAGES[lang];
    const open = chosen === lang;
    return (
      <li key={lang} className={classes.language} data-open={open || undefined}>
        <button
          type="button"
          className={classes.head}
          aria-expanded={open}
          onClick={() => {
            if (regions.length === 1) {
              start({ lang, region: regions[0] });
            } else {
              setChosen(lang);
              setRegion(regions[0]);
            }
          }}
        >
          <span className={classes.languageText}>
            <span className={classes.languageName}>{name}</span>
            <span lang={lang} className={classes.endonym}>
              {endonym}
            </span>
          </span>
          {!open && (
            <span className={classes.flags} aria-hidden="true">
              {(PREVIEW_REGIONS[lang] ?? regions.slice(0, 4)).map((code) => (
                <Flag key={code} region={code} size="34px" />
              ))}
            </span>
          )}
        </button>
        {open && (
          <div className={classes.countries}>
            <fieldset
              aria-label={`${name} countries`}
              className={classes.pills}
            >
              {[...regions].sort(byCountryName).map((code) => (
                <button
                  key={code}
                  type="button"
                  className={classes.pill}
                  aria-pressed={region === code}
                  onClick={() => setRegion(code)}
                >
                  <Flag region={code} size="22px" />
                  {regionName(code)}
                </button>
              ))}
            </fieldset>
            <Button onClick={() => start({ lang, region })}>Play</Button>
          </div>
        )}
      </li>
    );
  }

  if (native === undefined) return <div className={classes.game} />;

  if (native === null) {
    return (
      <section
        ref={section}
        tabIndex={-1}
        className={classes.picker}
        aria-label="Pick your language"
      >
        <ul className={classes.grid}>{VISITOR_NATIVES.map(languageCard)}</ul>
        <p id="landing-also" className={classes.also}>
          Already speak English or French? Start from it.
        </p>
        <ul className={classes.grid} aria-labelledby="landing-also">
          {VISITOR_ALSO.map(languageCard)}
        </ul>
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
        Change language
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
