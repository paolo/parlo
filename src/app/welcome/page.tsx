import { LandingPage } from "@/ui/landing/LandingPage";
import { landingMetadata } from "@/ui/landing/metadata";

export function generateMetadata() {
  return landingMetadata(process.env.BETTER_AUTH_URL);
}

// Signed-out visitors see this at `/`: src/proxy.ts rewrites the root here.
export default function WelcomePage() {
  return <LandingPage />;
}
