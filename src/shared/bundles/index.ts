import type { Bundle, BundleId } from "./types";

export type { Bundle, BundleId, BundlePhrase } from "./types";

/** Each bundle loads on demand, so its phrases only reach the browser on the Practice page. */
export const BUNDLE_LOADERS: Record<BundleId, () => Promise<Bundle>> = {
  starter: () => import("./starter").then((m) => m.starter),
};
