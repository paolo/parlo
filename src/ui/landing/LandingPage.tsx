"use client";

import { Button } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { LANG_CODES, LANGUAGES } from "../../shared/languages";
import { Flag } from "../Flag";
import { ThemeToggle } from "../ThemeToggle";
import { Wordmark } from "../Wordmark";
import { Conversation } from "./Conversation";
import classes from "./LandingPage.module.css";
import { PracticeDemo } from "./PracticeDemo";

const STEPS = [
  {
    title: "Save what you hear",
    text: "Star a translation and it joins your phrasebook.",
  },
  {
    title: "Flip through on the go",
    text: "Say it out loud, reveal, mark it. A few minutes between stops.",
  },
  {
    title: "All your languages at once",
    text: "Every card teaches all three, so none of them falls behind.",
  },
] as const;

export function LandingPage() {
  return (
    <div className={classes.page}>
      <header className={classes.wrap}>
        <div className={classes.bar}>
          <Wordmark size={30} />
          <div className={classes.barActions}>
            <ThemeToggle />
            {/* The sign-in page offers every way in: Google, and email and password in development. */}
            <Button component={Link} href="/sign-in">
              Sign in
            </Button>
          </div>
        </div>
      </header>

      <section className={`${classes.wrap} ${classes.hero}`}>
        <div className={classes.copy}>
          <span className={classes.eyebrow}>Made for newcomers</span>
          <h1 className={classes.h1}>Say it like a local.</h1>
          <p className={classes.lead}>
            The phrases you grew up with, turned into the way people actually
            say them in your other languages. Three languages, one meaning:
            never word for word.
          </p>
          <div className={classes.cta}>
            <Button
              component={Link}
              href="/sign-in"
              size="lg"
              rightSection={<IconArrowRight size={18} stroke={2} />}
            >
              Start with a phrase
            </Button>
          </div>
        </div>
        <Conversation />
      </section>

      <section className={classes.band}>
        <div className={`${classes.wrap} ${classes.practice}`}>
          <PracticeDemo />
          <div className={classes.copy}>
            <h2 className={classes.h2}>Practice on the bus ride.</h2>
            <ol className={classes.steps}>
              {STEPS.map((step, index) => (
                <li key={step.title} className={classes.step}>
                  <span
                    className={classes.number}
                    data-role={["native", "english", "french"][index]}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <span className={classes.stepText}>
                    <strong>{step.title}</strong>
                    <span>{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className={`${classes.wrap} ${classes.languages}`}>
        <div className={classes.copy}>
          <h2 className={classes.h2}>Start from home. Bring your three.</h2>
          <p className={classes.lead}>
            Pick your languages and where they are from, so the slang actually
            fits.
          </p>
        </div>
        <ul className={classes.grid}>
          {LANG_CODES.map((code) => {
            const { endonym, name, regions } = LANGUAGES[code];
            return (
              <li key={code} className={classes.language}>
                <span className={classes.languageText}>
                  <span className={classes.languageName}>{name}</span>
                  <span lang={code} className={classes.endonym}>
                    {endonym}
                  </span>
                </span>
                <span className={classes.flags} aria-hidden="true">
                  {regions.slice(0, 4).map((region) => (
                    <Flag key={region} region={region} size="34px" />
                  ))}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={`${classes.wrap} ${classes.closing}`}>
        <div className={classes.closer}>
          <span className={classes.dots} aria-hidden="true">
            <i data-role="native" />
            <i data-role="english" />
            <i data-role="french" />
          </span>
          <h2 className={classes.closerTitle}>
            Your next bus ride is a lesson.
          </h2>
          <Link href="/sign-in" className={classes.closerLink}>
            Hop on
            <IconArrowRight size={18} stroke={2} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className={classes.wrap}>
        <div className={classes.footer}>parlo.fun</div>
      </footer>
    </div>
  );
}
