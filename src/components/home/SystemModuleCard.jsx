import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react';
import { createPageUrl } from '@/utils';

/**
 * Interactive module card: cursor-tracked spotlight, hover lift, and
 * evidence/connections that expand on demand instead of dumping all text.
 */
export default function SystemModuleCard({ module: m, color, index }) {
  const Icon = m.icon;
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 0 });
  const [open, setOpen] = useState(false);

  const handleMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <motion.article
      ref={ref}
      onMouseMove={handleMove}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] p-5 transition-colors duration-300 hover:border-white/25 md:p-6"
    >
      {/* cursor spotlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(340px circle at ${pos.x}% ${pos.y}%, ${color}22, transparent 65%)` }}
      />
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-20 blur-[55px]" style={{ background: color }} />

      <div className="relative flex items-start justify-between gap-4">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110"
          style={{ borderColor: `${color}66`, boxShadow: `0 0 22px ${color}22` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 font-mono text-[8px] tracking-[.14em] text-slate-300">{m.status}</span>
      </div>

      <div className="relative mt-5">
        <h4 className="text-xl font-black text-white">{m.name}</h4>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{m.what}</p>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        {m.capabilities.map(x => (
          <span
            key={x}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] text-slate-300 transition-colors"
            style={{ borderColor: `${color}33`, background: `${color}0d` }}
          >
            <CheckCircle2 className="h-3 w-3" style={{ color }} />
            {x}
          </span>
        ))}
      </div>

      <button
        onClick={() => setOpen(o => !o)}
        className="relative mt-5 flex w-full items-center justify-between rounded-xl border border-white/[.07] bg-black/25 px-3 py-2.5 text-left transition-colors hover:border-white/20"
      >
        <span className="font-mono text-[8px] tracking-[.15em] text-white/45">CONNECTIONS + EVIDENCE</span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/50 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="relative overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-white/[.07] bg-black/20 p-3">
                <div className="font-mono text-[8px] tracking-[.15em] text-white/40">CONNECTED SYSTEMS</div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{m.connects.join(' · ')}</p>
              </div>
              <div className="rounded-xl border border-white/[.07] bg-black/20 p-3">
                <div className="font-mono text-[8px] tracking-[.15em] text-white/40">EVIDENCE</div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{m.evidence}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Link
        to={createPageUrl(m.route)}
        className="gl-energy-button relative mt-5 inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 font-mono text-[9px] font-bold tracking-[.13em] transition-all hover:-translate-y-0.5"
        style={{ color, borderColor: `${color}55`, background: `${color}10`, boxShadow: `0 0 20px ${color}18` }}
      >
        {m.action}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.article>
  );
}