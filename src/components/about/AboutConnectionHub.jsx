import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Fingerprint, QrCode, Workflow, ShieldCheck } from "lucide-react";

const NODES = [
  {
    icon: Fingerprint,
    label: "Identity",
    desc: "Resolve the subject",
    to: "/SecureQRStudio",
    accent: "#00E4FF",
    glow: "rgba(0,228,255,0.18)",
  },
  {
    icon: QrCode,
    label: "Image",
    desc: "Carry the content",
    to: "/ImageLab",
    accent: "#8C4BFF",
    glow: "rgba(140,75,255,0.18)",
  },
  {
    icon: Workflow,
    label: "Action",
    desc: "Run the workflow",
    to: "/NUPSLanding",
    accent: "#F5B942",
    glow: "rgba(245,185,66,0.18)",
  },
  {
    icon: ShieldCheck,
    label: "Evidence",
    desc: "Preserve the proof",
    to: "/GovernanceHub",
    accent: "#34D399",
    glow: "rgba(52,211,153,0.18)",
  },
];

export default function AboutConnectionHub() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  return (
    <div className="relative mx-auto w-full max-w-[34rem]">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#071827] via-[#03070d] to-[#150a22] p-5 shadow-[0_35px_100px_rgba(0,0,0,0.55)] sm:p-6">
        {/* header strip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/80">
              <span className="bg-gradient-to-br from-[#00E4FF] to-[#8C4BFF] bg-clip-text text-base font-black text-transparent">
                GL
              </span>
            </span>
            <div className="leading-tight">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">GL Connect</p>
              <p className="text-[10px] text-slate-500">One connected record</p>
            </div>
          </div>
          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">
            Interactive
          </span>
        </div>

        {/* node grid */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {NODES.map((node, index) => {
            const Icon = node.icon;
            const isActive = active === index;
            return (
              <motion.div
                key={node.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.07 }}
                onMouseEnter={() => setActive(index)}
              >
                <Link
                  to={node.to}
                  className={
                    "group relative flex h-full flex-col gap-3 rounded-2xl border p-4 transition-all focus:outline-none focus:ring-2 focus:ring-[#00E4FF] " +
                    (isActive
                      ? "border-white/25 bg-white/[0.06]"
                      : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.045]")
                  }
                  style={isActive ? { boxShadow: "0 0 30px " + node.glow } : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/60"
                      style={{ color: node.accent }}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <ArrowUpRight
                      className={"h-4 w-4 transition-colors " + (isActive ? "text-white" : "text-slate-600 group-hover:text-slate-400")}
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{node.label}</p>
                    <p className="mt-0.5 text-[11px] leading-tight text-slate-400">{node.desc}</p>
                  </div>
                  <div
                    className="h-0.5 w-full rounded-full transition-all"
                    style={{ background: isActive ? node.accent : "rgba(255,255,255,0.08)" }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* connecting flow line */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            The operating pattern
          </p>
          <div className="mt-3 flex items-center gap-2 overflow-x-auto">
            {NODES.map((node, index) => (
              <React.Fragment key={node.label}>
                <span
                  className="shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold"
                  style={{
                    color: node.accent,
                    borderColor: node.accent + "40",
                    background: node.accent + "12",
                  }}
                >
                  {node.label}
                </span>
                {index < NODES.length - 1 ? (
                  <span className="text-slate-600" aria-hidden="true">→</span>
                ) : null}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* primary CTA */}
        <Link
          to="/NUPSLanding"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] px-5 py-3 text-sm font-black text-white transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#00E4FF] focus:ring-offset-2 focus:ring-offset-black"
        >
          See it work in NUPS
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}