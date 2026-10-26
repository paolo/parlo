import { BUNDLE_LOADERS, type BundleId } from "../../shared/bundles";
import type { ProfileLanguage } from "../profile/types";
import type { NewBundleGroup } from "./types";

const isBundleId = (id: string): id is BundleId =>
  Object.hasOwn(BUNDLE_LOADERS, id);

/** The key a saved bundle phrase is found by again: "<bundleId>:<phraseId>". */
export const bundleRef = (bundleId: string, phraseId: string) =>
  `${bundleId}:${phraseId}`;

/**
 * A bundle phrase as a group to save for the user: one phrase per language of their profile. The root is the
 * language the phrase was written in when the user has it, otherwise their first language. Null for an
 * unknown bundle or phrase.
 */
export async function buildBundleGroup(
  userId: string,
  bundleId: string,
  phraseId: string,
  languages: ProfileLanguage[],
): Promise<NewBundleGroup | null> {
  if (!isBundleId(bundleId)) return null;
  const bundle = await BUNDLE_LOADERS[bundleId]();
  const source = bundle.phrases.find((p) => p.id === phraseId);
  if (!source) return null;
  const root = languages.some((l) => l.lang === source.source)
    ? source.source
    : languages[0]?.lang;
  return {
    userId,
    bundleRef: bundleRef(bundleId, phraseId),
    notes: null,
    correction: null,
    phrases: languages.map(({ lang }) => ({
      lang,
      text: source.text[lang],
      isRoot: lang === root,
    })),
  };
}
