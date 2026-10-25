import type { CSSProperties } from "react";

/** Circle flag for an ISO 3166-1 alpha-2 region, served from public/flags. Decorative unless `alt` is given. */
export function Flag({
  region,
  size = "1em",
  alt = "",
  style,
}: {
  region: string;
  size?: CSSProperties["width"];
  alt?: string;
  style?: CSSProperties;
}) {
  return (
    // Plain <img>: next/image would only add an optimizer pass that SVGs don't need.
    // biome-ignore lint/performance/noImgElement: see above
    <img
      src={`/flags/${region.toLowerCase()}.svg`}
      alt={alt}
      // Sizes go in CSS: the width and height attributes only take plain pixel numbers, so "1em" would become 1px.
      style={{
        display: "inline-block",
        verticalAlign: "-0.125em",
        width: size,
        height: size,
        ...style,
      }}
    />
  );
}
