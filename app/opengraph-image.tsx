import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "linear-gradient(150deg, #3b1119 0%, #42141d 45%, #500f1c 100%)",
          color: "#faf8f3",
          fontFamily: "sans-serif",
        }}
      >
        {/* concentric arch hints, bottom-right */}
        <div
          style={{
            position: "absolute",
            right: -160,
            bottom: -320,
            width: 640,
            height: 640,
            borderRadius: 9999,
            border: "1px solid rgba(250,248,243,0.14)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -60,
            bottom: -220,
            width: 440,
            height: 440,
            borderRadius: 9999,
            border: "1px solid rgba(250,248,243,0.12)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 6,
              border: "2px solid rgba(250,248,243,0.5)",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 30,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "rgba(250,248,243,0.85)",
              display: "flex",
            }}
          >
            Rex Haven Ventures
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 82, fontWeight: 600, lineHeight: 1.05, maxWidth: 900, display: "flex" }}>
            We invest, we build, we win together.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 34,
              color: "#e8dcc8",
              display: "flex",
            }}
          >
            {siteConfig.tagline}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
