import type { Lang } from "../shared/languages";

/**
 * The three language roles, in profile order: the first language is the native one (peach), the second lilac
 * and the third mint. The names come from the original Spanish, English and French design; they name the role,
 * not a language. Each has matching --parlo-<role> tokens.
 */
export const ROLES = ["native", "english", "french"] as const;
export type Role = (typeof ROLES)[number];

/** The role of a language in the viewer's profile, or undefined when it is not one of their languages. */
export function roleFor(lang: Lang, profileLangs: Lang[]): Role | undefined {
  return ROLES[profileLangs.indexOf(lang)];
}
