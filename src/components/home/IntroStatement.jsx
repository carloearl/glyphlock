import React from "react";
import { Link } from "react-router-dom";

export default function IntroStatement() {
  return (
    <div className="w-full text-center px-4 max-w-4xl mx-auto">
      <p className="text-sm sm:text-base text-white/70 leading-relaxed">
        GlyphLock is a software studio. We design, build, and run custom websites, apps, and
        business systems — then stay on to maintain and extend them.
      </p>

      <p className="mt-3 text-sm sm:text-base text-white/60 leading-relaxed">
        Point of sale, scheduling, payouts, reporting, integrations, and AI features. We've built
        and operate the NUPS venue platform, so you can see our work running in production.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/Solutions"
          className="w-full sm:w-auto px-7 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[#7B2CBF] to-[#00A3FF] shadow-[0_0_25px_rgba(0,240,255,0.35)] hover:shadow-[0_0_40px_rgba(0,240,255,0.55)] transition-all"
        >
Start a Project
        </Link>
        <Link
          to="/Services"
          className="w-full sm:w-auto px-7 py-3 rounded-full font-semibold text-cyan-300 border border-cyan-400/50 bg-white/[0.03] backdrop-blur-md hover:bg-cyan-400/10 transition-all"
        >
See What We Build
        </Link>
      </div>
    </div>
  );
}