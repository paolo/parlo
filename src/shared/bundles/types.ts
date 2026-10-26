import type { Lang } from "../languages";

export interface BundlePhrase {
  /** Stable, like "starter-014"; never reused or renumbered once released. */
  id: string;
  topic: string;
  /** The language it was written in; the other 12 are translations. */
  source: "en" | "fr";
  /** All 13 languages, enforced by the type. */
  text: Record<Lang, string>;
}

export interface Bundle {
  id: BundleId;
  name: string;
  phrases: BundlePhrase[];
}

export type BundleId = "starter";
