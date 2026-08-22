import React from "react";
import { ArrowRight, ImageIcon, MonitorSmartphone } from "lucide-react";

function Stage({ label, title, caption, icon: Icon, note }) {
  return (
    <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md overflow-hidden">
      <div className="px-6 pt-6">
        <p className="text-xs tracking-[0.25em] uppercase text-blue-300 font-bold">{label}</p>
        <h3 className="text-xl font-bold text-white mt-2">{title}</h3>
      </div>

      {/* Asset slot — replace src when the cleared capture is available */}
      <div className="mx-6 mt-5 aspect-[16/10] rounded-xl border border-dashed border-blue-400/30 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 flex flex-col items-center justify-center gap-3 text-center px-6">
        <Icon className="w-9 h-9 text-blue-300/70" />
        <p className="text-sm text-blue-200/70">{note}</p>
      </div>

      <p className="px-6 py-5 text-sm text-blue-200/70 leading-relaxed">{caption}</p>
    </div>
  );
}

export default function PrototypeToLiveWorkflow() {
  return (
    <section id="prototype" className="w-full max-w-6xl mb-16">
      <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-3">
        Prototype to Live Venue Workflow
      </h2>
      <p className="text-blue-300 text-center mb-10 max-w-2xl mx-auto">
        Two stages: the carrier experiment that proved continuity, and the operating
        system that put it behind a venue front door.
      </p>

      <div className="flex flex-col lg:flex-row items-stretch gap-5">
        <Stage
          label="Stage 1 — Prototype"
          title="Concealed-image carrier experiment"
          icon={ImageIcon}
          note="Carrier-image demonstration asset"
          caption="Early carrier experiment: an ordinary image holding a retrievable payload. Demonstration asset, not production output."
        />

        <div className="flex items-center justify-center lg:px-2">
          <ArrowRight className="w-8 h-8 text-blue-400/60 rotate-90 lg:rotate-0" />
        </div>

        <Stage
          label="Stage 2 — Operational system"
          title="NUPS front-door workflow"
          icon={MonitorSmartphone}
          note="Clean capture with synthetic demonstration identity"
          caption="NUPS front-door workflow used in live venue evaluation. Interface shown with synthetic demonstration data."
        />
      </div>

      <p className="mt-6 text-xs text-blue-300/60 text-center max-w-3xl mx-auto">
        Captures on this page are produced with synthetic demonstration identities. No
        guest, driver, or entertainer identity or address information from live operations
        is published here.
      </p>
    </section>
  );
}