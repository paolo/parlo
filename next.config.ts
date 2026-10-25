import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  // History and Review moved: keep old links and installed home-screen shortcuts working.
  async redirects() {
    return [
      { source: "/history", destination: "/phrasebook", permanent: true },
      {
        source: "/phrasebook/review",
        destination: "/practice",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
