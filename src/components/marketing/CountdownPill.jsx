import React, { useEffect, useState } from "react";

// FIXED GLOBAL LAUNCH (AZ 00:00 => UTC 07:00)
const LAUNCH_UTC = Date.UTC(2026, 0, 1, 7, 0, 0);

function getRemaining() {
  const nowUTC = Date.now();
  const diff = LAUNCH_UTC - nowUTC;

  if (diff <= 0) return { over: true, d: 0, h: 0, m: 0, s: 0 };

  return {
    over: false,
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000) % 24),
    m: Math.floor((diff / 60000) % 60),
    s: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownPill() {
  const [t, setT] = useState(getRemaining());
  useEffect(() => {
    const i = setInterval(() => setT(getRemaining()), 1000);
    return () => clearInterval(i);
  }, []);

  const pad = (n) => n.toString().padStart(2, "0");

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
          <p className="text-[0.7rem] sm:text-xs tracking-[0.3em] text-green-300 uppercase">
            Pre-Launch Engineering Mode
          </p>

          <p className="text-lg sm:text-xl md:text-2xl font-semibold text-green-100 mt-1">
            Launching{" "}
            <span className="font-bold text-green-300">
              January 1st, 2026
            </span>
          </p>
        </div>

        {/* Countdown */}
        {!t.over ? (
          <div className="relative z-10 mt-5 flex justify-center gap-6 sm:gap-10 md:gap-12">
            {[
              ["Days", t.d],
              ["Hours", t.h],
              ["Minutes", t.m],
              ["Seconds", t.s],
            ].map(([label, val]) => (
              <div key={label} className="flex flex-col items-center">
                <span className="
                  text-2xl sm:text-3xl md:text-4xl 
                  font-bold text-green-100 
                  tracking-widest tabular-nums
                  drop-shadow-[0_0_8px_rgba(34,197,94,0.65)]
                ">
                  {pad(val)}
                </span>
                <span className="
                  text-[0.55rem] sm:text-xs uppercase tracking-[0.18em] text-green-300 mt-1
                ">
                  {label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="relative z-10 mt-5 text-center text-green-200 font-medium text-sm">
            Launch Phase Activated — Systems Online.
          </p>
        )}

        {/* Micro text */}
        <p className="relative z-10 text-center text-[0.6rem] mt-4 text-green-400/70 tracking-wide">
          Countdown is globally synchronized using UTC for accuracy.
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