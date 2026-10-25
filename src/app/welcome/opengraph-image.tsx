import { DEFAULT_THEME, mergeMantineTheme } from "@mantine/core";
import { ImageResponse } from "next/og";
import { conversationAt } from "@/ui/landing/phrases";
import { theme } from "@/ui/theme";

export const alt = "parlo: say it like a local";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Link previews can't use Mantine or CSS variables, so the same theme values are read here; nothing is hard-coded.
// The preview shows the dark look, the reference scheme.
const full = mergeMantineTheme(DEFAULT_THEME, theme);
const colors = {
  page: full.colors.dark[7],
  text: full.colors.dark[0],
  dimmed: full.colors.dark[2],
  // Dark text on the three language role colors.
  onAccent: full.colors.dark[7],
  native: full.colors.native[0],
  english: full.colors.english[0],
  french: full.colors.french[0],
};

type Role = "native" | "english" | "french";

// Rounded all round and a little tilted, like the phrase cards in the app.
const TILT = { left: "-1.2deg", right: "1deg" };

// No flags here: ImageResponse fetches emoji artwork over the network at build time, so the preview shows phrases only.
function Bubble({
  text,
  side,
  langRole,
}: {
  text: string;
  side: "left" | "right";
  langRole: Role;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: side === "left" ? "flex-start" : "flex-end",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: colors[langRole],
          borderRadius: 30,
          transform: `rotate(${TILT[side]})`,
          padding: "20px 32px",
        }}
      >
        <div style={{ fontSize: 38, fontWeight: 700, color: colors.onAccent }}>
          {text}
        </div>
      </div>
    </div>
  );
}

// The Wordmark component uses CSS modules and variables, which ImageResponse can't read: same look, inline.
function Wordmark({ size }: { size: number }) {
  const dot = Math.round(size * 0.23);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: size * 0.2,
        fontSize: size,
        fontWeight: 800,
        letterSpacing: -size * 0.045,
        lineHeight: 1,
        color: colors.text,
      }}
    >
      <div>parlo</div>
      <div style={{ display: "flex", gap: 3 }}>
        {(["native", "english", "french"] as const).map((role) => (
          <div
            key={role}
            style={{
              width: dot,
              height: dot,
              borderRadius: dot,
              background: colors[role],
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Statically generated at build time: it has no request-time inputs.
export default async function Image() {
  const { set, native } = conversationAt(0);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: colors.page,
        padding: "0 80px",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 52, left: 80, display: "flex" }}>
        <Wordmark size={52} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", width: 460 }}>
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            color: colors.text,
          }}
        >
          Say it like a local.
        </div>
        <div style={{ fontSize: 28, marginTop: 28, color: colors.dimmed }}>
          The phrases you grew up with, turned into the way people actually say
          them in your other languages.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          width: 540,
        }}
      >
        <Bubble text={set.phrases[native]} side="left" langRole="native" />
        <Bubble text={set.phrases.en} side="right" langRole="english" />
        <Bubble text={set.phrases.fr} side="left" langRole="french" />
      </div>
    </div>,
    size,
  );
}
