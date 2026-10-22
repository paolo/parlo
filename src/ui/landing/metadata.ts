import type { Metadata } from "next";

const TITLE = "parlo: say it like a local, in three languages";
const DESCRIPTION =
  "Understand and use colloquial phrases across your three languages.";

/** `origin` is the public site URL; it lets Next turn the preview image path into an absolute URL. */
export function landingMetadata(origin: string | undefined): Metadata {
  return {
    metadataBase: origin ? new URL(origin) : undefined,
    title: TITLE,
    description: DESCRIPTION,
    openGraph: { type: "website", title: TITLE, description: DESCRIPTION },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
    },
  };
}
