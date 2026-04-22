/**
 * DemoModeBanner — Persistent top-of-page champagne/gold pill shown on every /demo/* route.
 */
import React from "react";

export default function DemoModeBanner() {
  return (
    <div
      role="status"
      aria-label="Demo mode active"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 80,
        width: "100%",
        background: "linear-gradient(90deg, rgba(10,10,11,0.95) 0%, rgba(24,18,5,0.95) 50%, rgba(10,10,11,0.95) 100%)",
        borderBottom: "1px solid rgba(234,179,8,0.25)",
        backdropFilter: "blur(12px)",
        padding: "8px 16px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 11,
        letterSpacing: "0.28em",
        color: "#eab308",
        textTransform: "uppercase",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#eab308", boxShadow: "0 0 8px #eab308" }} />
      <span>Demo Mode</span>
      <span style={{ opacity: 0.5 }}>•</span>
      <span>Seeded Data</span>
      <span style={{ opacity: 0.5 }}>•</span>
      <span>Not Live Production</span>
    </div>
  );
}