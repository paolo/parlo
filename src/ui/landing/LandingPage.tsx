"use client";

import { Button } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { ThemeToggle } from "../ThemeToggle";
import { Wordmark } from "../Wordmark";
import { Conversation } from "./Conversation";
import { LandingGame } from "./LandingGame";
import classes from "./LandingPage.module.css";
import { NextLesson } from "./NextLesson";

const STEPS = [
  {
    title: "Save what you hear",
    text: "Save a translation and it joins your phrasebook.",
  },
  {
    title: "Flip through on the go",
    text: "Say it out loud, reveal, mark it. A few minutes a day.",
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
          <h1 className={classes.h1}>Learn it the way locals say it.</h1>
          <p className={classes.lead}>
            Everyday phrases, the way people really say them. Every card has all
            three of your languages, so each one helps the other two. Pick yours
            and play a round.
          </p>
          <div className={classes.cta}>
            <Button
              component={Link}
              href="#play"
              size="lg"
              rightSection={<IconArrowRight size={18} stroke={2} />}
            >
              Play a round
            </Button>
          </div>
        </div>
        <Conversation />
      </section>

      <section id="play" className={classes.band}>
        <div className={`${classes.wrap} ${classes.start}`}>
          <div className={classes.copy}>
            <h2 className={classes.h2}>Start here. We'll bring you there.</h2>
            <p className={classes.lead}>
              Pick the language you grew up with. Your cards take you to English
              and French, one everyday phrase at a time.
            </p>
          </div>
          <LandingGame />
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
      </section>

      <section className={`${classes.wrap} ${classes.closing}`}>
        <div className={classes.closer}>
          <span className={classes.dots} aria-hidden="true">
            <i data-role="native" />
            <i data-role="english" />
            <i data-role="french" />
          </span>
          <NextLesson />
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
