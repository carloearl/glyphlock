import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';

const DIAGRAM_URL = 'https://media.base44.com/images/public/697a087fb354faebb72df54b/5bdc370e2_a7704a78-5dca-4c60-aaf9-fa9f60af4aef.png';

export default function EcosystemBlueprint() {
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[1480px] px-5 md:px-8 xl:px-12">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="font-mono text-[10px] tracking-[.24em] text-cyan-300">SYSTEM BLUEPRINT</span>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-5xl">THE GLYPHLOCK ECOSYSTEM</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
            One end-to-end map: identity and access at the door, NUPS operations on the floor, and GlyphLock Financial settling payouts — over a real-time unified database with audit and compliance built in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-5 py-3 font-mono text-[11px] tracking-[.18em] text-cyan-100 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-cyan-200/70 hover:bg-cyan-400/20"
        >
          <Maximize2 className="h-4 w-4" /> VIEW FULL SIZE
        </button>
      </div>

      <motion.button
        type="button"
        onClick={() => setZoomed(true)}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="group relative block w-full overflow-hidden rounded-3xl border border-cyan-300/25 bg-[#020713]/60 p-2 shadow-[0_0_46px_rgba(34,211,238,.16)] backdrop-blur-xl transition-all hover:border-cyan-200/60 hover:shadow-[0_0_70px_rgba(34,211,238,.3)]"
      >
        <img
          src={DIAGRAM_URL}
          alt="GlyphLock ecosystem architecture diagram showing venues, access and identity layer, NUPS operations, GlyphLock Financial settlement, enterprise integration rail, and the GlyphLock foundation"
          loading="lazy"
          className="w-full rounded-2xl"
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-[#020713] via-[#020713]/70 to-transparent py-4 font-mono text-[10px] tracking-[.2em] text-cyan-100 opacity-0 transition-opacity group-hover:opacity-100">
          CLICK TO ENLARGE
        </span>
      </motion.button>

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="GlyphLock ecosystem diagram, full size"
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-auto bg-black/90 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label="Close diagram"
            onClick={() => setZoomed(false)}
            className="fixed right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/40 bg-[#020713]/80 text-cyan-100"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={DIAGRAM_URL}
            alt="GlyphLock ecosystem architecture diagram, full size"
            onClick={(event) => event.stopPropagation()}
            className="max-w-none rounded-xl md:w-[1600px]"
          />
        </div>
      )}
    </div>
  );
}