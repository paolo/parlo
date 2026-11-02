"use client";

import { Button, TextInput } from "@mantine/core";
import { useState } from "react";
import { countriesFor, languagesIn } from "../shared/countries";
import { LANGUAGES, type Lang, regionName } from "../shared/languages";
import classes from "./CountryPicker.module.css";
import { Flag } from "./Flag";
import type { VisitorPick } from "./visitor";

type Step = { kind: "country" } | { kind: "language"; country?: string };

/**
 * "Where are you from?": a searchable grid of countries where one of `langs` is spoken. A country with one of
 * those languages picks it at once; one with several asks which. Whoever's country is missing can pick a
 * language directly. Either way the pick carries a country, which is the region Parlo tunes its slang to.
 */
export function CountryPicker({
  langs,
  onPick,
}: {
  langs: readonly Lang[];
  onPick: (pick: VisitorPick) => void;
}) {
  const [step, setStep] = useState<Step>({ kind: "country" });
  const [query, setQuery] = useState("");

  if (step.kind === "language") {
    const { country } = step;
    const options = country ? languagesIn(country, langs) : [...langs];
    return (
      <div className={classes.root}>
        <p className={classes.step}>Which language?</p>
        <ul className={classes.pills}>
          {options.map((lang) => (
            <li key={lang}>
              <button
                type="button"
                className={classes.pill}
                lang={lang}
                onClick={() =>
                  onPick({
                    lang,
                    region: country ?? LANGUAGES[lang].defaultRegion,
                  })
                }
              >
                {LANGUAGES[lang].endonym}
              </button>
            </li>
          ))}
        </ul>
        <div>
          <Button
            variant="default"
            onClick={() => setStep({ kind: "country" })}
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  const needle = query.trim().toLowerCase();
  const countries = countriesFor(langs).filter((code) =>
    regionName(code).toLowerCase().includes(needle),
  );
  return (
    <div className={classes.root}>
      <TextInput
        type="search"
        aria-label="Search countries"
        placeholder="Search countries"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
      {countries.length === 0 ? (
        <p className={classes.empty}>
          No country matches that. Try another spelling, or pick your language.
        </p>
      ) : (
        <ul className={classes.pills}>
          {countries.map((code) => (
            <li key={code}>
              <button
                type="button"
                className={classes.pill}
                onClick={() => {
                  const options = languagesIn(code, langs);
                  if (options.length === 1) {
                    onPick({ lang: options[0], region: code });
                  } else {
                    setStep({ kind: "language", country: code });
                  }
                }}
              >
                <Flag region={code} size="22px" />
                {regionName(code)}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div>
        <Button
          variant="subtle"
          color="gray"
          onClick={() => setStep({ kind: "language" })}
        >
          My country isn't listed
        </Button>
      </div>
    </div>
  );
}
