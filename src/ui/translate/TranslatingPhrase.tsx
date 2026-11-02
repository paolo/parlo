import { VisuallyHidden } from "@mantine/core";
import type { CSSProperties } from "react";
import type { ProfileLanguage } from "@/server/profile/types";
import { LANGUAGES } from "../../shared/languages";
import { Flag } from "../Flag";
import { ROLES } from "../roles";
import classes from "./TranslatingPhrase.module.css";

/** Words past this are not given their own beat, so a long phrase repeats the wave instead of crawling. */
const WAVE_LENGTH = 6;

/**
 * What the output column shows while a translation is on its way: the typed phrase lit up word by word in the
 * three role colors, and the viewer's languages taking turns to glow. Purely decorative motion; assistive
 * technology just hears "Translating".
 */
export function TranslatingPhrase({
  text,
  languages,
}: {
  text: string;
  languages: ProfileLanguage[];
}) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <section className={classes.card}>
      <VisuallyHidden role="status">Translating</VisuallyHidden>
      <span className={classes.caption} aria-hidden="true">
        Reading your phrase…
      </span>
      <p className={classes.words} dir="auto" aria-hidden="true">
        {words.map((word, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: the words never reorder, and repeats are allowed
            key={i}
            className={classes.word}
            data-role={ROLES[i % ROLES.length]}
            style={{ "--i": i % WAVE_LENGTH } as CSSProperties}
          >
            {word}
          </span>
        ))}
      </p>
      <ul className={classes.chips} aria-hidden="true">
        {languages.map((l, position) => (
          <li
            key={l.lang}
            className={classes.chip}
            data-role={ROLES[position]}
            style={{ "--i": position } as CSSProperties}
          >
            <Flag region={l.region} size="20px" ring={ROLES[position]} />
            {LANGUAGES[l.lang].endonym}
          </li>
        ))}
      </ul>
    </section>
  );
}
