import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #0e0e0e 0%, #1a1a2e 50%, #0f0f23 100%)",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-50%",
          right: "-20%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-30%",
          left: "-10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(244,63,94,0.1) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: "#f1f5f9",
          letterSpacing: "-0.02em",
          marginBottom: 16,
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        VangaTypePanalam
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 500,
          color: "#94a3b8",
          textAlign: "center",
          maxWidth: 700,
          lineHeight: 1.4,
          marginBottom: 32,
        }}
      >
        Learn Typing in English, Tamil & Tanglish
      </div>
      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 16, color: "#6366f1", fontWeight: 600 }}>Free</span>
        <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#475569" }} />
        <span style={{ fontSize: 16, color: "#a78bfa", fontWeight: 600 }}>Adaptive</span>
        <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#475569" }} />
        <span style={{ fontSize: 16, color: "#6366f1", fontWeight: 600 }}>Offline</span>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
