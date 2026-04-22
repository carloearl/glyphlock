/**
 * DemoStatusCard — Premium elevated card for Command Center status metrics.
 * Supports: emphasis ("primary" = large/gold/high-contrast), "standard", "quarantined".
 */
import React from "react";

export default function DemoStatusCard({ label, value, sublabel, emphasis = "standard", icon: Icon }) {
  const isPrimary = emphasis === "primary";
  const isQuarantined = emphasis === "quarantined";
  const isAlert = emphasis === "alert";

  const accent = isPrimary
    ? "#eab308"
    : isAlert
    ? "#ef4444"
    : isQuarantined
    ? "#525252"
    : "#22d3ee";

  return (
    <div
      style={{
        position: "relative",
        padding: isPrimary ? "24px 24px" : "20px 20px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        border: `1px solid ${isPrimary ? "rgba(234,179,8,0.3)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 12,
        boxShadow: isPrimary
          ? "0 10px 30px rgba(234,179,8,0.15), 0 0 0 1px rgba(234,179,8,0.08)"
          : "0 8px 20px rgba(0,0,0,0.25)",
        transition: "transform 0.25s ease, border-color 0.25s ease",
        overflow: "hidden",
        animation: "demoCardIn 0.3s ease-out both",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent, opacity: isQuarantined ? 0.3 : 0.9 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        {Icon && <Icon style={{ width: 14, height: 14, color: accent }} />}
        <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: isQuarantined ? "#737373" : "#a3a3a3", fontWeight: 600 }}>
          {label}
        </div>
      </div>

      <div
        style={{
          fontSize: isPrimary ? 40 : 28,
          fontWeight: 700,
          color: isQuarantined ? "#525252" : isPrimary ? "#fafafa" : "#f5f5f5",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>

      {sublabel && (
        <div style={{ fontSize: 12, color: isQuarantined ? "#525252" : "#a3a3a3", marginTop: 8 }}>
          {sublabel}
        </div>
      )}

      <style>{`@keyframes demoCardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}