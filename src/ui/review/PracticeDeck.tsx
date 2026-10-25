import type { ReactNode } from "react";
import { LANGUAGES, type Lang } from "../../shared/languages";
import { Flag } from "../Flag";
import { useProfileRegion } from "../queries";
import { type Role, roleFor } from "../roles";
import classes from "./PracticeDeck.module.css";
import type { ReviewCard } from "./session";

/**
 * The front card plus two cards peeking out behind it while more are waiting. `step` changes with every
 * graded card so the next one is dealt in. `children` is the lower part of the card: how the user answers.
 */
export function PracticeDeck({
  card,
  lang,
  profileLangs,
  remaining,
  step,
  children,
}: {
  card: ReviewCard;
  lang: Lang;
  profileLangs: Lang[];
  /** Cards not yet got: decides how many cards show behind this one. */
  remaining: number;
  step: number;
  children: ReactNode;
}) {
  const region = useProfileRegion(lang);
  const role: Role | undefined = roleFor(lang, profileLangs);
  return (
    <div className={classes.deck}>
      {remaining >= 2 && <div className={classes.back} aria-hidden="true" />}
      {remaining >= 3 && (
        <div className={classes.back} data-slot="second" aria-hidden="true" />
      )}
      <article
        key={`${card.id}-${step}`}
        className={classes.card}
        data-role={role}
      >
        <span className={classes.label}>
          <Flag region={region ?? LANGUAGES[lang].defaultRegion} size="20px" />
          {LANGUAGES[lang].endonym}
        </span>
        <p className={classes.front} lang={lang} dir="auto">
          {card.front.text}
        </p>
        {children}
      </article>
    </div>
  );
}
