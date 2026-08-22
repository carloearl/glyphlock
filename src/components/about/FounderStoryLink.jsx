import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function FounderStoryLink() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-5xl mx-auto rounded-3xl p-8 sm:p-10 border border-blue-400/30 bg-white/[0.03] backdrop-blur-md">
        <p className="text-xs tracking-[0.3em] uppercase text-blue-300 font-bold mb-3">
          Founder Story
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
          Carlo René Earl — Founder, Owner, CEO
        </h2>
        <p className="text-blue-100/85 leading-relaxed max-w-3xl">
          GlyphLock started inside real venue operations, where nobody could reconstruct
          what actually happened on a shift. A carrier experiment revealed the continuity
          principle behind it, and that principle became GlyphLock and the Nexus Unified
          POS System now used in a live venue environment.
        </p>
        <Link
          to="/AboutCarlo"
          className="mt-7 inline-flex items-center gap-2 min-h-[44px] px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold"
        >
          Read the full founder story
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}