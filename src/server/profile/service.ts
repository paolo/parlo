import { LANGUAGES, PROFILE_SIZE } from "../../shared/languages";
import type { ProfileInput, ProfileLanguage } from "./types";

/** Turns the user's ordered picks into profile rows: the first is native, the rest are learning. */
export function buildProfile(input: ProfileInput[]): ProfileLanguage[] {
  return input.map(({ lang, region }, position) => ({
    lang,
    region: region ?? LANGUAGES[lang].defaultRegion,
    level: position === 0 ? "native" : "intermediate",
    position,
  }));
}

export function isProfileComplete(profile: ProfileLanguage[]): boolean {
  return profile.length === PROFILE_SIZE;
}
