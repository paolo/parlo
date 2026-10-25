import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import type { ProfileLanguage } from "@/server/profile/types";
import { LANGUAGES } from "../../shared/languages";
import { Flag } from "../Flag";
import { ROLES } from "../roles";
import classes from "./LanguageStrip.module.css";

/** The viewer's three languages, native first, as ringed flags; it links to the profile where they change. */
export function LanguageStrip({ languages }: { languages: ProfileLanguage[] }) {
  const [native, ...others] = languages;
  if (!native) return null;
  const name = (l: ProfileLanguage) => LANGUAGES[l.lang].endonym;
  const pill = (l: ProfileLanguage, position: number) => (
    <span key={l.lang} className={classes.pill}>
      <Flag region={l.region} size="22px" ring={ROLES[position]} />
      {name(l)}
    </span>
  );
  return (
    <Link
      href="/profile"
      className={classes.strip}
      aria-label={`Your languages: ${languages.map(name).join(", ")}. Change them in your profile.`}
    >
      {pill(native, 0)}
      <IconArrowRight size={20} stroke={2} aria-hidden="true" />
      <span className={classes.group}>
        {others.map((l, i) => pill(l, i + 1))}
      </span>
    </Link>
  );
}
