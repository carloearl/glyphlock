/**
 * DemoActionButton — Single-tap destination button for Command Center actions.
 * Min 56px tap target, rounded 8px, subtle shadow.
 */
import React from "react";
import { useNavigate } from "react-router-dom";

export default function DemoActionButton({ label, icon: Icon, to, onClick, variant = "standard" }) {
  const navigate = useNavigate();
  const handle = () => {
    if (onClick) onClick();
    if (to) navigate(to);
  };

  const accent = variant === "primary" ? "#eab308" : variant === "danger" ? "#ef4444" : "#22d3ee";

  return (
    <button
      onClick={handle}
      style={{
        minHeight: 72,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        color: "#fafafa",
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: "0.02em",
        cursor: "pointer",
        transition: "all 0.2s",
        textAlign: "left",
        width: "100%",
        boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
        touchAction: "manipulation",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.boxShadow = `0 10px 24px rgba(0,0,0,0.4), 0 0 0 1px ${accent}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.3)";
      }}
    >
      {Icon && (
        <div
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
            background: `${accent}15`,
            border: `1px solid ${accent}40`,
          }}
        >
          <Icon style={{ width: 18, height: 18, color: accent, pointerEvents: "none" }} />
        </div>
      )}
      <span style={{ pointerEvents: "none" }}>{label}</span>
    </button>
  );
}