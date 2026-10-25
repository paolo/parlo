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

// Matches --parlo-ground; a viewport entry cannot read CSS variables.
export const viewport: Viewport = { themeColor: "#15141b" };

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
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
