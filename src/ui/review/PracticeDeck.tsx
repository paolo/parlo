import { LANGUAGES, type Lang } from "../../shared/languages";
import { Flag } from "../Flag";
import { useProfileRegion } from "../queries";
import { type Role, roleFor } from "../roles";
import classes from "./PracticeDeck.module.css";
import type { ReviewCard } from "./session";

/**
 * The front card plus two cards peeking out behind it while more are waiting. `step` changes with every
 * graded card so the next one is dealt in.
 */
export function PracticeDeck({
  card,
  lang,
  profileLangs,
  remaining,
  step,
  revealed,
  onReveal,
  onGrade,
}: {
  card: ReviewCard;
  lang: Lang;
  profileLangs: Lang[];
  /** Cards not yet got: decides how many cards show behind this one. */
  remaining: number;
  step: number;
  revealed: boolean;
  onReveal: () => void;
  onGrade: (result: "gotIt" | "again") => void;
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
        {revealed && (
          <div className={classes.answers}>
            {card.back.map((phrase) => (
              <p
                key={phrase.lang}
                className={classes.answer}
                data-role={roleFor(phrase.lang, profileLangs)}
              >
                <span className={classes.answerLang}>
                  {LANGUAGES[phrase.lang].endonym}
                </span>
                <span
                  className={classes.answerText}
                  lang={phrase.lang}
                  dir="auto"
                >
                  {phrase.text}
                </span>
              </p>
            ))}
          </div>
        )}
        <div className={classes.actions}>
          {revealed ? (
            <>
              <button
                type="button"
                className={classes.action}
                data-variant="ghost"
                onClick={() => onGrade("again")}
              >
                Again
              </button>
              <button
                type="button"
                className={classes.action}
                onClick={() => onGrade("gotIt")}
              >
                Got it
              </button>
            </>
          ) : (
            <button type="button" className={classes.action} onClick={onReveal}>
              Reveal
            </button>
          )}
        </div>
      </article>
    </div>
  );
}
