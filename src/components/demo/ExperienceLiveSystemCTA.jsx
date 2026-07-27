import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";

/**
 * The NUPS landing variant is intentionally hidden. The public page now
 * prioritizes the real recorded contract workflow instead of routing visitors
 * into a generic demo gate that does not represent the production experience.
 * The home-page variant remains available where it is still used.
 */
export default function ExperienceLiveSystemCTA({ variant = "home" }) {
  const navigate = useNavigate();
  const go = () => navigate("/demo/gate");

  if (variant === "nups") return null;

  return (
    <div className="w-full flex justify-center px-4 py-8 md:py-10">
      <button
        onClick={go}
        aria-label="Experience the system"
        className="group relative inline-flex items-center gap-3 px-8 py-4 md:px-10 md:py-5 rounded-2xl text-white font-bold tracking-wider uppercase text-sm md:text-base transition-all duration-300 hover:scale-[1.02] min-h-[56px]"
        style={{
          background: "linear-gradient(135deg, #1e40af 0%, #4f46e5 50%, #6366f1 100%)",
          boxShadow: "0 0 40px rgba(79,70,229,0.5), 0 0 80px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
          border: "1px solid rgba(147,197,253,0.3)",
          touchAction: "manipulation",
        }}
      >
        <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-blue-200" style={{ pointerEvents: "none" }} />
        <span style={{ pointerEvents: "none" }}>Experience the System</span>
        <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" style={{ pointerEvents: "none" }} />
      </button>
    </div>
  );
}
