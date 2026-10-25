import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "../styles/tokens.css";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "parlo",
  description:
    "Translate phrases between your three languages, the way people actually say them.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${cyrillic.variable}`}
      {...mantineHtmlProps}
    >
      <head>
        {/* Dark only until the light palette lands (see docs/plans/2026-10-25-redesign-plan.md, Task 8). */}
        <ColorSchemeScript forceColorScheme="dark" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
