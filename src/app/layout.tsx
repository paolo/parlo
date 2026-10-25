import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "../styles/tokens.css";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Onest } from "next/font/google";
import { Providers } from "./providers";

const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
});

const sans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

// Neither font above has Cyrillic. The face only downloads when a Cyrillic character is on screen.
const cyrillic = Onest({
  subsets: ["cyrillic", "cyrillic-ext"],
  variable: "--font-cyrillic",
  preload: false,
});

// themeColor matches --parlo-ground; a viewport entry cannot read CSS variables. viewportFit "cover" lets the
// bottom navigation reach the screen edge and read env(safe-area-inset-bottom) in the installed iOS app.
export const viewport: Viewport = {
  themeColor: "#15141b",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "parlo",
  description:
    "Translate phrases between your three languages, the way people actually say them.",
  applicationName: "parlo",
  // Lets "Add to Home Screen" on iOS open parlo full screen, without Safari's bars. The status bar keeps its
  // default style so it follows the system light or dark setting and never sits over the page.
  appleWebApp: { capable: true, title: "parlo" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${cyrillic.variable}`}
      {...mantineHtmlProps}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
