import type { MetadataRoute } from "next";

// Colors are the --parlo-ground token value: a manifest cannot read CSS variables.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "parlo",
    short_name: "parlo",
    description:
      "Translate phrases between your three languages, the way people actually say them.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#15141b",
    theme_color: "#15141b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // Android crops this one to its own shape (circle, squircle...); the artwork stays inside the safe zone.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
