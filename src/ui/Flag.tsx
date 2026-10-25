import type { CSSProperties } from "react";
import type { Role } from "./roles";

/**
 * Circle flag for an ISO 3166-1 alpha-2 region, served from public/flags. Decorative unless `alt` is given.
 * `ring` draws a 2px ring in a language role's color, for flags that sit on the dark ground.
 */
export function Flag({
  region,
  size = "1em",
  alt = "",
  ring,
  style,
}: {
  region: string;
  size?: CSSProperties["width"];
  alt?: string;
  ring?: Role;
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
        borderRadius: "50%",
        flex: "none",
        boxShadow: ring ? `0 0 0 2px var(--parlo-${ring})` : undefined,
        ...style,
      }}
    />
  );
}
