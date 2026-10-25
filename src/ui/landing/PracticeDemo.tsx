"use client";

import { useState } from "react";
import { Flag } from "../Flag";
import classes from "./PracticeDemo.module.css";

/** A tiny, fixed deck: it shows what practice feels like, without calling the app. */
const DECK = [
  {
    lang: "es",
    name: "Español",
    region: "MX",
    src: "Costar un ojo de la cara",
    en: "To cost an arm and a leg",
    fr: "Coûter les yeux de la tête",
  },
  {
    lang: "pt",
    name: "Português",
    region: "BR",
    src: "Pagar o pato",
    en: "To take the fall",
    fr: "Payer les pots cassés",
  },
  {
    lang: "uk",
    name: "Українська",
    region: "UA",
    src: "Вішати локшину на вуха",
    en: "To feed someone a line",
    fr: "Raconter des salades",
  },
] as const;

export function PracticeDemo() {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = DECK[index % DECK.length];

  function act() {
    if (revealed) {
      setIndex((i) => i + 1);
      setRevealed(false);
    } else {
      setRevealed(true);
    }
  }

  return (
    <div className={classes.deck}>
      <div className={classes.back} data-role="english" aria-hidden="true" />
      <div className={classes.back} data-role="french" aria-hidden="true" />
      <article key={index} className={classes.card}>
        <span className={classes.label}>
          <Flag region={card.region} size="20px" />
          {card.name}
        </span>
        <p className={classes.src} lang={card.lang}>
          {card.src}
        </p>
        {revealed && (
          <div className={classes.answers}>
            <p className={classes.answer} data-role="english" lang="en">
              {card.en}
            </p>
            <p className={classes.answer} data-role="french" lang="fr">
              {card.fr}
            </p>
          </div>
        )}
        <button type="button" className={classes.action} onClick={act}>
          {revealed ? "Next card" : "Reveal"}
        </button>
      </article>
    </div>
  );
}
