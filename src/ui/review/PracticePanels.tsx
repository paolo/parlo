import { IconCheck, IconX } from "@tabler/icons-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { LANGUAGES, type Lang } from "../../shared/languages";
import { roleFor } from "../roles";
import { gradeAnswer, type Verdict } from "./answer";
import classes from "./PracticeDeck.module.css";
import type { ReviewCard } from "./session";

type Grade = "gotIt" | "again";

function Pill({
  children,
  onClick,
  ghost,
  type = "button",
}: {
  children: string;
  onClick?: () => void;
  ghost?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={classes.action}
      data-variant={ghost ? "ghost" : undefined}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Flip mode: read the front, try to recall the rest, reveal it, then say whether you had it. */
export function RevealPanel({
  card,
  profileLangs,
  onGrade,
}: {
  card: ReviewCard;
  profileLangs: Lang[];
  onGrade: (result: Grade) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <>
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
            <Pill ghost onClick={() => onGrade("again")}>
              Again
            </Pill>
            <Pill onClick={() => onGrade("gotIt")}>Got it</Pill>
          </>
        ) : (
          <Pill onClick={() => setRevealed(true)}>Reveal</Pill>
        )}
      </div>
    </>
  );
}

const VERDICT_TEXT: Record<Verdict, string> = {
  correct: "Correct",
  almost: "Almost",
  wrong: "Not quite",
};

/** Type mode: write the phrase in the answer language and get it checked on the spot, with no model involved. */
export function TypedPanel({
  card,
  answerLang,
  profileLangs,
  onGrade,
}: {
  card: ReviewCard;
  answerLang: Lang;
  profileLangs: Lang[];
  onGrade: (result: Grade) => void;
}) {
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const expected = card.answer;

  // A fresh card is dealt: be ready to type, which also raises the keyboard on a phone.
  useEffect(() => input.current?.focus(), []);

  if (!expected) return null;
  const answerRole = roleFor(answerLang, profileLangs);

  function check(event: FormEvent) {
    event.preventDefault();
    if (typed.trim() === "" || !expected) return;
    setVerdict(gradeAnswer(typed, expected.text));
  }

  if (verdict && expected) {
    return (
      <>
        <div className={classes.answers}>
          <p
            className={classes.verdict}
            data-verdict={verdict}
            aria-live="polite"
          >
            {verdict === "wrong" ? (
              <IconX size={18} stroke={1.8} aria-hidden="true" />
            ) : (
              <IconCheck size={18} stroke={1.8} aria-hidden="true" />
            )}
            {VERDICT_TEXT[verdict]}
          </p>
          {verdict !== "correct" && (
            <p className={classes.answer} data-role="typed">
              <span className={classes.answerLang}>You wrote</span>
              <span className={classes.answerText} lang={answerLang} dir="auto">
                {typed}
              </span>
            </p>
          )}
          <p className={classes.answer} data-role={answerRole}>
            <span className={classes.answerLang}>
              {LANGUAGES[answerLang].endonym}
            </span>
            <span className={classes.answerText} lang={answerLang} dir="auto">
              {expected.text}
            </span>
          </p>
        </div>
        <div className={classes.actions}>
          {verdict === "correct" && (
            <Pill onClick={() => onGrade("gotIt")}>Next</Pill>
          )}
          {verdict === "almost" && (
            <>
              <Pill ghost onClick={() => onGrade("again")}>
                Again
              </Pill>
              <Pill onClick={() => onGrade("gotIt")}>Count it</Pill>
            </>
          )}
          {verdict === "wrong" && (
            <>
              <Pill ghost onClick={() => onGrade("gotIt")}>
                I was right
              </Pill>
              <Pill onClick={() => onGrade("again")}>Again</Pill>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <form className={classes.typed} onSubmit={check}>
      <label className={classes.typedLabel}>
        <span>Write it in {LANGUAGES[answerLang].endonym}</span>
        <input
          ref={input}
          className={classes.input}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          lang={answerLang}
          dir="auto"
          // The phone must not "fix" what is being tested.
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
        />
      </label>
      <div className={classes.actions}>
        <Pill type="submit">Check</Pill>
      </div>
    </form>
  );
}
