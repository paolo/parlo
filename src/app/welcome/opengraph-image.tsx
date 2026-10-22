import { DEFAULT_THEME, mergeMantineTheme } from "@mantine/core";
import { ImageResponse } from "next/og";
import { conversationAt } from "@/ui/landing/phrases";
import { cssVariablesResolver, theme } from "@/ui/theme";

export const alt = "Parlo: three languages, one meaning";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Link previews can't use Mantine, so the same theme values are read here; nothing is hard-coded.
const full = mergeMantineTheme(DEFAULT_THEME, theme);
const light = cssVariablesResolver(full).light as Record<string, string>;
const colors = {
  page: light["--mantine-color-body"] as string,
  text: light["--mantine-color-text"] as string,
  dimmed: light["--mantine-color-dimmed"] as string,
  accent: full.colors.parlo[6] as string,
  surface: "#ffffff",
};

const TAIL = { left: "36px 36px 36px 8px", right: "36px 36px 8px 36px" };

function Bubble({
  label,
  text,
  side,
}: {
  label: string;
  text: string;
  side: "left" | "right";
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
          background: colors.surface,
          borderRadius: TAIL[side],
          padding: "20px 32px",
          boxShadow: "0 8px 28px rgba(60, 70, 140, 0.14)",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: colors.accent }}>
          {label}
        </div>
        <div style={{ fontSize: 38, fontWeight: 700, color: colors.text }}>
          {text}
        </div>
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
      }}
    >
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
          Three languages. One meaning.
        </div>
        <div style={{ fontSize: 28, marginTop: 28, color: colors.dimmed }}>
          Understand what people really say, and say what you mean like they
          would.
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
        <Bubble
          label={native.toUpperCase()}
          text={set.phrases[native]}
          side="left"
        />
        <Bubble label="EN" text={set.phrases.en} side="right" />
        <Bubble label="FR" text={set.phrases.fr} side="left" />
      </div>
    </div>,
    size,
  );
}
