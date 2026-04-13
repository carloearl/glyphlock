/**
 * NUPSEnvBanner — Unmistakable environment indicator for NUPS
 * Shows LIVE (green), TEST (amber), or DEMO (blue) with distinct visual treatment
 * Environment is determined by:
 *   - DEMO: path contains "Sandbox" OR user.is_demo OR role=DEMO
 *   - TEST: localStorage nups_env = 'test' OR explicit prop
 *   - LIVE: default (production, real data)
 */
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const ENV_CONFIG = {
  demo: {
    label: "DEMO / SANDBOX",
    sublabel: "All data is mock only · No real records created · Safe to experiment",
    icon: "🔬",
    banner: "bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 border-b-2 border-emerald-500",
    badge: "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50",
    dot: "bg-emerald-400",
    pulse: true,
    textColor: "text-emerald-200",
  },
  test: {
    label: "TEST MODE",
    sublabel: "Writes go to TEST database · Not production data · For staff training only",
    icon: "⚠️",
    banner: "bg-gradient-to-r from-amber-900 via-yellow-900 to-orange-900 border-b-2 border-amber-500",
    badge: "bg-amber-500/30 text-amber-300 border border-amber-500/50",
    dot: "bg-amber-400",
    pulse: true,
    textColor: "text-amber-200",
  },
  live: {
    label: "LIVE",
    sublabel: "Production data · Real transactions · Handle with care",
    icon: "●",
    banner: "bg-black border-b border-green-500/40",
    badge: "bg-green-500/20 text-green-400 border border-green-500/40",
    dot: "bg-green-400",
    pulse: false,
    textColor: "text-green-400",
  },
};

export default function NUPSEnvBanner({ env: envProp, user }) {
  const location = useLocation();
  const [env, setEnv] = useState('live');

  useEffect(() => {
    if (envProp) { setEnv(envProp); return; }

    // Auto-detect environment
    const path = location.pathname.toLowerCase();
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('nups_env') : null;
    const session = (() => { try { return JSON.parse(sessionStorage.getItem('nups_session') || '{}'); } catch { return {}; } })();

    if (path.includes('sandbox') || session.is_demo || session.role === 'DEMO') {
      setEnv('demo');
    } else if (stored === 'test') {
      setEnv('test');
    } else {
      setEnv('live');
    }
  }, [location.pathname, envProp]);

  const cfg = ENV_CONFIG[env];

  // LIVE env gets a compact indicator, TEST and DEMO get loud banners
  if (env === 'live') {
    return (
      <div className={`${cfg.banner} px-4 py-1.5 flex items-center justify-center gap-2`}>
        <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot}`} />
        <span className={`text-[11px] font-bold tracking-widest uppercase ${cfg.textColor}`}>{cfg.label}</span>
        <span className="text-[10px] text-gray-600 hidden sm:inline">— Production · All transactions are real</span>
      </div>
    );
  }

  return (
    <div className={`${cfg.banner} px-4 py-2.5`}>
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-xl">{cfg.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black tracking-widest uppercase ${cfg.badge}`}>
                {cfg.pulse && <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />}
                {cfg.label}
              </span>
            </div>
            <p className={`text-[11px] mt-0.5 ${cfg.textColor} opacity-80`}>{cfg.sublabel}</p>
          </div>
        </div>
        {env === 'test' && (
          <button
            onClick={() => { localStorage.removeItem('nups_env'); window.location.reload(); }}
            className="text-[10px] font-bold text-amber-400 border border-amber-500/40 rounded-lg px-3 py-1 hover:bg-amber-500/20 transition-colors flex-shrink-0"
          >
            Exit Test Mode
          </button>
        )}
      </div>
    </div>
  );
}