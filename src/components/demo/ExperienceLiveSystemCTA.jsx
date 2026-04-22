/**
 * ExperienceLiveSystemCTA — The single surgical CTA insertion permitted on
 * landing pages. Routes to /demo/gate (email capture).
 *
 * Two visual variants so each landing page feels native:
 *  - variant="nups"  → harmonizes with NUPSLanding (cyan/sapphire/violet glow)
 *  - variant="home"  → harmonizes with Home (royal blue gradient, glass card)
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";

export default function ExperienceLiveSystemCTA({ variant = "home" }) {
  const navigate = useNavigate();
  const go = () => navigate("/demo/gate");

  if (variant === "nups") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "24px 16px 48px",
          position: "relative",
          zIndex: 3,
        }}
      >
        <button
          onClick={go}
          aria-label="Experience the Live System"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "18px 32px",
            minHeight: 56,
            background: "linear-gradient(135deg, #1e6fff, #8b5cf6)",
            color: "#ffffff",
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            border: "1px solid rgba(0,212,255,0.4)",
            cursor: "pointer",
            clipPath: "polygon(16px 0, 100% 0, calc(100% - 16px) 100%, 0 100%)",
            boxShadow: "0 0 40px rgba(30,111,255,0.4), 0 0 80px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
            transition: "all 0.3s",
            touchAction: "manipulation",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 10px 50px rgba(139,92,246,0.55), 0 0 80px rgba(0,212,255,0.3), inset 0 1px 0 rgba(255,255,255,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 0 40px rgba(30,111,255,0.4), 0 0 80px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.2)";
          }}
        >
          <Sparkles style={{ width: 16, height: 16, color: "#6ee7f9", pointerEvents: "none" }} />
          <span style={{ pointerEvents: "none" }}>Experience the Live System</span>
          <ArrowRight style={{ width: 16, height: 16, pointerEvents: "none" }} />
        </button>
      </div>
    );
  }

  // Home variant — royal blue / indigo, matches Home's existing palette
  return (
    <div className="w-full flex justify-center px-4 py-8 md:py-10">
      <button
        onClick={go}
        aria-label="Experience the Live System"
        className="group relative inline-flex items-center gap-3 px-8 py-4 md:px-10 md:py-5 rounded-2xl text-white font-bold tracking-wider uppercase text-sm md:text-base transition-all duration-300 hover:scale-[1.02] min-h-[56px]"
        style={{
          background: "linear-gradient(135deg, #1e40af 0%, #4f46e5 50%, #6366f1 100%)",
          boxShadow: "0 0 40px rgba(79,70,229,0.5), 0 0 80px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
          border: "1px solid rgba(147,197,253,0.3)",
          touchAction: "manipulation",
        }}
      >
        <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-200" style={{ pointerEvents: "none" }} />
        <span style={{ pointerEvents: "none" }}>Experience the Live System</span>
        <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" style={{ pointerEvents: "none" }} />
      </button>
    </div>
  );
}