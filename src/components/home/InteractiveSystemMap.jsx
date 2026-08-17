import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, MousePointerClick } from 'lucide-react';
import { layers, modules } from '@/components/home/systemMapData';
import SystemLayerRail from '@/components/home/SystemLayerRail';
import SystemModuleCard from '@/components/home/SystemModuleCard';

export default function InteractiveSystemMap() {
  const [activeLayer, setActiveLayer] = useState('OPERATE');
  const [autoPlay, setAutoPlay] = useState(true);

  const visible = useMemo(() => modules.filter(m => m.layer === activeLayer), [activeLayer]);
  const active = layers.find(l => l.id === activeLayer) || layers[0];
  const activeIndex = layers.findIndex(l => l.id === active.id);

  const step = (dir) => {
    setAutoPlay(false);
    const next = (activeIndex + dir + layers.length) % layers.length;
    setActiveLayer(layers[next].id);
  };

  const select = (id) => { setAutoPlay(false); setActiveLayer(id); };

  // Guided tour — advances until the visitor takes over.
  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => {
      setActiveLayer(prev => {
        const i = layers.findIndex(l => l.id === prev);
        return layers[(i + 1) % layers.length].id;
      });
    }, 4200);
    return () => clearInterval(t);
  }, [autoPlay]);

  return (
    <section
      id="system-map"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      }}
      className="gl-home-section relative mx-auto max-w-7xl px-5 py-20 outline-none md:py-28"
    >
      <div className="pointer-events-none absolute inset-x-[8%] top-[20%] h-80 rounded-full bg-cyan-500/[.07] blur-[130px]" />

      <div className="relative mb-10 text-center">
        <div className="font-mono text-[10px] tracking-[.28em] text-cyan-300 md:text-xs">// LIVE ARCHITECTURE EXPLORER</div>
        <h2 className="mt-4 text-4xl font-black leading-[.92] text-white md:text-6xl lg:text-7xl">
          SEVEN LAYERS.<br />
          <span className="bg-gradient-to-r from-cyan-200 via-blue-400 to-violet-400 bg-clip-text text-transparent">ONE RUNNING SYSTEM.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-slate-300 md:text-lg">
          The tour is already moving. Take control of any layer to see what it runs, what it connects to, and the evidence behind every claim.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/[.06] px-3.5 py-1.5 font-mono text-[9px] tracking-[.16em] text-cyan-100">
          <MousePointerClick className="h-3.5 w-3.5" /> CLICK A LAYER TO TAKE OVER
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/25 bg-[#020611]/[.58] shadow-[0_0_55px_rgba(34,211,238,.12),0_0_120px_rgba(124,58,237,.10)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage:'linear-gradient(rgba(34,211,238,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.09) 1px,transparent 1px)', backgroundSize:'38px 38px' }} />

        {/* layer progress bar */}
        <div className="relative h-[3px] w-full bg-white/[.05]">
          <motion.div
            className="h-full"
            animate={{ width: `${((activeIndex + 1) / layers.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: `linear-gradient(90deg, ${active.color}55, ${active.color})`, boxShadow: `0 0 16px ${active.color}` }}
          />
        </div>

        <div className="relative grid lg:grid-cols-[262px_1fr]">
          <div className="border-b border-white/10 lg:border-b-0 lg:border-r">
            <SystemLayerRail
              layers={layers}
              modules={modules}
              activeLayer={activeLayer}
              onSelect={select}
              autoPlay={autoPlay}
              onToggleAutoPlay={() => setAutoPlay(a => !a)}
            />
          </div>

          <div className="relative min-h-[560px] p-5 md:p-8 lg:p-10">
            <AnimatePresence mode="wait">
              <motion.div key={activeLayer} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-7 md:flex-row md:items-start">
                  <div>
                    <div className="font-mono text-[9px] tracking-[.22em]" style={{ color: active.color }}>
                      LAYER {String(activeIndex + 1).padStart(2, '0')} / {String(layers.length).padStart(2, '0')} // {active.id}
                    </div>
                    <h3 className="mt-2 text-3xl font-black text-white md:text-5xl">{active.id}</h3>
                    <p className="mt-3 max-w-2xl leading-relaxed text-slate-300">{active.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/[.06] px-3 py-2 font-mono text-[9px] tracking-[.15em] text-emerald-200">
                    <Activity className="h-3.5 w-3.5 animate-pulse" /> SYSTEM PATH ACTIVE
                  </div>
                </div>

                <div className="mt-7 grid gap-4 xl:grid-cols-2">
                  {visible.map((m, i) => (
                    <SystemModuleCard key={m.name} module={m} color={active.color} index={i} />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 font-mono text-[9px] tracking-[.16em] text-slate-500">
        {layers.map((l, i) => (
          <React.Fragment key={l.id}>
            <button
              onClick={() => select(l.id)}
              className="transition-colors hover:text-white"
              style={l.id === active.id ? { color: l.color } : {}}
            >
              {l.id}
            </button>
            {i < layers.length - 1 && <span className="text-white/15">→</span>}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}