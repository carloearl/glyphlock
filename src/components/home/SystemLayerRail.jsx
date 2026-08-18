import React from 'react';
import { motion } from 'framer-motion';

/**
 * Horizontal / vertical layer chain. Each node shows its module count and
 * lights up on hover, so the rail itself is explorable rather than a plain list.
 */
export default function SystemLayerRail({ layers, modules, activeLayer, onSelect, autoPlay, onToggleAutoPlay }) {
  return (
    <div className="p-3 md:p-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="font-mono text-[9px] tracking-[.2em] text-white/35">LAYER CHAIN</span>
        <button
          onClick={onToggleAutoPlay}
          className="rounded-full border border-white/15 bg-white/[.04] px-2.5 py-1 font-mono text-[8px] tracking-[.16em] text-slate-300 transition-colors hover:border-cyan-300/50 hover:text-cyan-200"
        >
          {autoPlay ? 'TOUR ON' : 'TOUR OFF'}
        </button>
      </div>

      <div className="flex lg:flex-col gap-2 overflow-x-auto [scrollbar-width:none]">
        {layers.map((layer, idx) => {
          const Icon = layer.icon;
          const selected = activeLayer === layer.id;
          const count = modules.filter(m => m.layer === layer.id).length;
          return (
            <motion.button
              key={layer.id}
              onClick={() => onSelect(layer.id)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              aria-pressed={selected}
              className={`group relative flex flex-shrink-0 items-center gap-3 overflow-hidden rounded-xl border px-4 py-3.5 text-left transition-colors duration-300 ${selected ? 'bg-white/[.08] text-white' : 'border-white/[.07] bg-white/[.025] text-slate-400 hover:text-white hover:bg-white/[.06]'}`}
              style={selected ? { borderColor: `${layer.color}88`, boxShadow: `0 0 30px ${layer.color}33, inset 0 0 26px ${layer.color}14` } : {}}
            >
              <span
                className="absolute inset-y-0 left-0 w-[3px] origin-top transition-transform duration-300"
                style={{ background: layer.color, transform: selected ? 'scaleY(1)' : 'scaleY(0)' }}
              />
              <Icon
                className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                style={{ color: layer.color, filter: selected ? `drop-shadow(0 0 9px ${layer.color})` : undefined }}
              />
              <span className="flex-1 font-mono text-[10px] font-bold tracking-[.13em]">{layer.id}</span>
              <span className="font-mono text-[9px] text-white/30">{String(count).padStart(2, '0')}</span>
              {selected && (
                <motion.span
                  layoutId="map-active-dot"
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: layer.color, boxShadow: `0 0 12px ${layer.color}` }}
                />
              )}
              {idx < layers.length - 1 && (
                <span className="pointer-events-none absolute -bottom-1 left-6 hidden h-2 w-px bg-white/10 lg:block" />
              )}
            </motion.button>
          );
        })}
      </div>

      <p className="mt-3 px-1 font-mono text-[8px] leading-relaxed tracking-[.14em] text-white/25">
        ↑ ↓ ARROW KEYS TO STEP THROUGH LAYERS
      </p>
    </div>
  );
}