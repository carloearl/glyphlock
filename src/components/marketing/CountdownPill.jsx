import React, { useEffect, useState } from "react";

// Launch date: Jan 1, 2026 00:00 Arizona Time (UTC-7 => UTC 07:00)
const LAUNCH_UTC = Date.UTC(2026, 0, 1, 7, 0, 0);

function getTimeSinceLaunch() {
  const nowUTC = Date.now();
  const diff = nowUTC - LAUNCH_UTC;

  if (diff <= 0) return { notLaunched: true, d: 0, h: 0, m: 0, s: 0 };

  return {
    notLaunched: false,
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000) % 24),
    m: Math.floor((diff / 60000) % 60),
    s: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownPill() {
  const [t, setT] = useState(getTimeSinceLaunch());
  useEffect(() => {
    const i = setInterval(() => setT(getTimeSinceLaunch()), 1000);
    return () => clearInterval(i);
  }, []);

  const pad = (n) => n.toString().padStart(2, "0");

  // System is LIVE - show operational status
  return (
    <div className="w-full flex justify-center mt-10 mb-4 px-4 select-none">
      <div className="
        relative max-w-4xl w-full 
        rounded-full overflow-hidden
        bg-[rgba(2,25,10,0.6)]
        backdrop-blur-2xl
        border border-green-500/50
        shadow-[0_0_55px_rgba(34,197,94,0.45)]
        px-10 py-6 sm:px-14 sm:py-7

        before:absolute before:inset-0 before:rounded-full
        before:bg-gradient-to-r before:from-green-600/30 before:via-emerald-500/20 before:to-teal-600/25
        before:blur-xl before:opacity-70

        after:absolute after:inset-0 after:rounded-full 
        after:bg-[radial-gradient(circle_at_25%_30%,rgba(255,255,255,0.18),transparent_65%)]
        after:opacity-40 mix-blend-screen

        animate-[cardGlow_6s_ease-in-out_infinite]
      ">

        {/* Title */}
        <div className="relative z-10 flex flex-col items-center">
          <p className="text-[0.7rem] sm:text-xs tracking-[0.3em] text-green-300 uppercase font-bold">
            Beta Version 2.0
          </p>

          <p className="text-lg sm:text-xl md:text-2xl font-black text-green-100 mt-1">
            <span className="font-black text-green-300 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]">
              Live — All Systems Operational
            </span>
          </p>
        </div>

        {/* Time Since Launch */}
        <div className="relative z-10 mt-5 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-60 animate-ping"></div>
              <div className="relative w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <span className="text-green-200/90 text-sm sm:text-base font-medium">
              {t.notLaunched ? 'Initializing...' : `Day ${t.d} — Runtime ${pad(t.h)}:${pad(t.m)}:${pad(t.s)}`}
            </span>
          </div>
        </div>

        {/* Micro text */}
        <p className="relative z-10 text-center text-[0.6rem] mt-4 text-green-400/70 tracking-wide">
          Operational since January 1st, 2026 00:00 Arizona Time (UTC-7)
        </p>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes cardGlow {
          0% { box-shadow: 0 0 38px rgba(34,197,94,0.25); }
          50% { box-shadow: 0 0 70px rgba(34,197,94,0.55); }
          100% { box-shadow: 0 0 38px rgba(34,197,94,0.25); }
        }
      `}</style>
    </div>
  );
}