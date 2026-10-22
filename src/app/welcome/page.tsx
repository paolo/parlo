import { LandingPage } from "@/ui/landing/LandingPage";

// Signed-out visitors see this at `/`: src/proxy.ts rewrites the root here.
export default function WelcomePage() {
  return <LandingPage />;
}
