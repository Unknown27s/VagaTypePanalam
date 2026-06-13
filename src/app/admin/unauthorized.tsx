"use client";
import { useEffect, useRef } from "react";
import "@/styles/unauthorized.css";
import "@/styles/typing.css";

const STARS = [
  [3,384,194,13,14],[3,44,109,12,10],[3,310,87,10,8],[2,94,302,10,8],[1,85,75,9,14],
  [3,332,38,9,8],[1,187,284,10,15],[1,354,250,8,11],[2,400,333,11,6],[1,369,141,12,13],
  [1,367,12,10,13],[3,151,289,8,18],[3,149,103,8,12],[3,218,147,9,7],[2,315,279,10,17],
  [1,157,306,13,17],[1,384,252,11,4],[3,44,138,13,18],[3,354,252,9,8],[1,97,63,11,6],
  [2,277,287,8,15],[2,77,291,12,12],[2,120,224,6,9],[2,139,165,10,7],[3,65,235,13,13],
  [3,76,322,11,12],[3,183,113,9,12],[3,8,8,11,7],[3,255,297,12,4],[3,152,297,12,7],
  [1,107,13,13,7],[2,36,208,8,9],[2,356,112,13,6],[1,90,57,12,4],[1,237,304,9,13],
  [3,293,273,10,5],[2,177,311,8,11],[2,84,268,7,4],[1,302,20,6,14],[1,62,64,6,6],
  [2,125,97,7,17],[2,178,134,11,11],[1,52,198,8,7],[1,360,275,8,11],[2,77,66,8,9],
  [3,36,328,7,16],[3,269,316,8,8],[1,133,63,10,7],[2,269,82,13,17],[3,314,101,10,17],
];

export default function AdminUnauthorized() {
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = starsRef.current;
    if (!container) return;
    STARS.forEach(([sz, l, t, dur, del]) => {
      const star = document.createElement("div");
      star.style.cssText = `
        width:${sz}px;height:${sz}px;left:${l}px;top:${t}px;
        position:absolute;border-radius:50%;background:#fff;
        animation:twinkle ${dur}s linear infinite;animation-delay:${del}s;
      `;
      const glow = document.createElement("span");
      glow.style.cssText = `
        display:block;width:${sz}px;height:${sz}px;position:absolute;
        top:0;left:0;background:#fff;filter:blur(1px);border-radius:50%;
      `;
      star.appendChild(glow);
      container.appendChild(star);
    });
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a, #1e293b)",
      padding: "2rem",
    }}>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "4rem",
        width: "100%",
        maxWidth: "900px",
      }}>

        {/* Text side */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "1rem",
        }}>
          <p style={{
            fontFamily: "'Comic Neue', cursive",
            fontSize: "8rem",
            fontWeight: 300,
            color: "#e2e8f0",
            lineHeight: 1,
            margin: 0,
          }}>
            403
          </p>

          <p style={{ fontSize: "1.1rem", color: "#94a3b8", maxWidth: "280px", lineHeight: 1.6, margin: 0 }}>
            You do not have permission to access the admin dashboard.
          </p>

          <p style={{ fontSize: "0.875rem", color: "#64748b", maxWidth: "280px", fontStyle: "italic", margin: 0 }}>
           Wrong door, buddy. The user section is back that way. 👉
          </p>

          <a href="/" style={{
            display: "inline-block",
            background: "#3b82f6",
            color: "#fff",
            fontWeight: 500,
            padding: "0.5rem 1.5rem",
            borderRadius: "8px",
            textDecoration: "none",
            marginTop: "0.5rem",
          }}>
            Return to Home
          </a>
        </div>

        {/* Space window */}
        <div style={{
          width: 200,
          height: 350,
          borderRadius: 100,
          boxShadow: "-3px -3px 0 5px #2a2a3e, 5px 5px 0 2px #3a3a4e",
          background: "linear-gradient(310deg, #020024 0%, #09096b 0%, black 80%)",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}>
          <div ref={starsRef} style={{
            width: 400,
            height: "100%",
            position: "absolute",
            top: 0,
            right: 0,
            animation: "flyby 30s linear infinite",
          }} />
        </div>

      </div>
    </div>
  );
}