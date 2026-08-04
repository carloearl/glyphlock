import React from "react";
import { Link } from "react-router-dom";

export default function IntroStatement() {
  return (
    <div className="w-full text-center px-4 max-w-4xl mx-auto">
      <p className="text-sm sm:text-base text-white/70 leading-relaxed">
        GlyphLock builds secure technology for creators, artists, studios and venues. We protect
        identity, intellectual property, music, artwork and digital assets with authentication,
        AI governance and enforceable digital controls.
      </p>

      <p className="mt-3 text-sm sm:text-base text-white/60 leading-relaxed">
        Websites, apps, software platforms, automated DJ systems, studio technology, venue
        operations and the NUPS platform. Built around the way you create, perform and operate.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/Solutions"
          className="w-full sm:w-auto px-7 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[#7B2CBF] to-[#00A3FF] shadow-[0_0_25px_rgba(0,240,255,0.35)] hover:shadow-[0_0_40px_rgba(0,240,255,0.55)] transition-all"
        >
          Explore GlyphLock
        </Link>
        <Link
          to="/Services"
          className="w-full sm:w-auto px-7 py-3 rounded-full font-semibold text-cyan-300 border border-cyan-400/50 bg-white/[0.03] backdrop-blur-md hover:bg-cyan-400/10 transition-all"
        >
          Discover Our Technology
        </Link>
      </div>
    </div>
  );
}