import React from "react";

export const ROSTER_ROLES = [
  { name: "Alfred", role: "Point Guard (Floor General)", desc: "Orchestrates the chain, calls the plays, enforces execution order so every touch has purpose." },
  { name: "Claude", role: "Shooting Guard (Closer)", desc: "Pure shot-maker on hard problems: deep reasoning, constraints, proofs. When it has to be right, the ball goes here." },
  { name: "Gemini", role: "Power Forward (Matchup Nightmare)", desc: "Multimodal force that bangs inside with data and stretches the floor with text, vision, code, and context." },
  { name: "Copilot", role: "Small Forward (Two-Way Wing)", desc: "Does the dirty work across the floor: enterprise integration, refactors, PRs, and safe deployment at scale." },
  { name: "Perplexity", role: "Center (Rim Protector)", desc: "Lives on truth—rebounds live data, blocks hallucinations, cleans every possession at the source." },
  { name: "Cursor", role: "Sixth Man (Spark Plug & Binder)", desc: "Comes off the bench and binds the stack—wires Alfred's plays into Claude, proxies Gemini, pipes through Copilot, feeds Perplexity clean looks." },
];

export default function RosterRolesGrid() {
  return (
    <div className="max-w-6xl mx-auto px-6 pb-20">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-5xl font-black">
          <span className="text-white">THE </span>
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">LINEUP</span>
        </h2>
        <p className="text-violet-300 mt-3 text-sm md:text-base uppercase tracking-widest font-bold">Starting five + sixth man</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {ROSTER_ROLES.map((player) => (
          <div
            key={player.name}
            className="p-6 rounded-2xl bg-black/60 border-2 border-blue-500/40 backdrop-blur-md hover:border-cyan-400 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-all duration-300"
          >
            <h3 className="text-xl font-black text-blue-400 mb-1">{player.name}</h3>
            <p className="text-sm text-white/90 font-bold mb-3">{player.role}</p>
            <p className="text-sm text-white/80 leading-relaxed">{player.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}