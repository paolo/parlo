import Link from "next/link";
import type { ProfileLanguage } from "@/server/profile/types";
import { LANGUAGES, type Lang } from "../../shared/languages";
import { Flag } from "../Flag";
import { ROLES } from "../roles";
import classes from "./LanguageStrip.module.css";

/**
 * The viewer's three languages, native first, each with its ringed flag; it links to the profile where they
 * change. Any of them can be typed, so there is no direction until a translation comes back: then `detected`
 * lights up the language the phrase was in, in that language's color.
 */
export function LanguageStrip({
  languages,
  detected,
}: {
  languages: ProfileLanguage[];
  detected?: Lang;
}) {
  if (languages.length === 0) return null;
  const names = languages.map((l) => LANGUAGES[l.lang].endonym);
  const detectedName = detected ? LANGUAGES[detected].endonym : null;
  return (
    <Link
      href="/profile"
      className={classes.strip}
      aria-label={`Your languages: ${names.join(", ")}.${
        detectedName ? ` Detected: ${detectedName}.` : ""
      } Change them in your profile.`}
    >
      {languages.map((l, position) => (
        <span
          key={l.lang}
          className={classes.pill}
          data-role={ROLES[position]}
          data-detected={l.lang === detected || undefined}
        >
          <Flag region={l.region} size="22px" ring={ROLES[position]} />
          {LANGUAGES[l.lang].endonym}
        </span>
      ))}
    </Link>
  );
}
