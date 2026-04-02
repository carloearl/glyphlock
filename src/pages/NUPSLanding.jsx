import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function NUPSLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Enter") navigate("/NUPSGateway"); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navigate]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black">
      {/* Full-screen WebGL canvas animation */}
      <iframe
        src="https://media.base44.com/files/public/697a087fb354faebb72df54b/edcb0d48f_nups-final5.html"
        className="absolute inset-0 w-full h-full border-0"
        style={{ pointerEvents: 'auto' }}
        title="NUPS Visual"
      />

      {/* React overlay — Enter Platform button */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-[clamp(80px,14vh,140px)]">
        <button
          onClick={() => navigate("/NUPSGateway")}
          className="pointer-events-auto px-10 py-3 rounded-full font-bold uppercase text-sm text-white transition-all duration-200 active:scale-95"
          style={{
            fontFamily: "'Orbitron', monospace",
            letterSpacing: '0.25em',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            boxShadow: '0 0 40px rgba(124,58,237,0.6), 0 0 80px rgba(124,58,237,0.25)',
            border: '1px solid rgba(167,139,250,0.4)',
          }}
        >
          Enter Platform
        </button>
        <p className="mt-4 text-[9px] font-mono tracking-[0.4em] uppercase pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.15)', fontFamily: "'Orbitron', monospace" }}>
          PRESS ENTER · SECURED BY GLYPHLOCK
        </p>
      </div>
    </div>
  );
}