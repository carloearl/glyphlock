import React from "react";
import { Activity, BrainCircuit, Radio, RefreshCw, ShieldCheck, Sparkles, Zap } from "lucide-react";

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-950/60 px-3 py-2 min-w-[120px]">
      <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500 font-bold">{label}</div>
      <div className="text-lg font-black text-white leading-tight">{value}</div>
      {sub && <div className="text-[10px] text-slate-500 truncate">{sub}</div>}
    </div>
  );
}

function StatusPill({ status }) {
  const styles = status === "READY"
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
    : status === "NO_PLAYABLE_SOURCE"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
      : "border-rose-500/40 bg-rose-500/10 text-rose-300";
  const label = status === "READY" ? "READY" : status === "NO_PLAYABLE_SOURCE" ? "SOURCE BLOCKED" : "CATALOG EMPTY";
  return <span className={`px-2 py-1 rounded-full border text-[10px] font-black tracking-wider ${styles}`}>{label}</span>;
}

export default function DJAutomationDeck({
  autoDj,
  loading,
  error,
  snapshot,
  plan,
  activePersona,
  activeEntertainer,
  activeCrowd,
  lastUpdated,
  onRefresh,
}) {
  const next = plan?.next;
  const duplicateCount = snapshot?.quality?.duplicate_track_count || 0;
  const pending = snapshot?.jukebox_requests?.length || 0;
  const energy = activeCrowd?.energy_score ?? 5;
  const transition = plan?.transition || {};

  return (
    <section className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-3">
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: "radial-gradient(500px circle at 10% 0%, rgba(99,102,241,.22), transparent 60%)" }} />
      <div className="relative space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-violet-300" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80 font-black">NUPS DJ Decision Engine</div>
              <div className="text-sm font-bold text-white">Live Automation Command Deck</div>
            </div>
          </div>
          <StatusPill status={plan?.status || "EMPTY_CATALOG"} />
          <span className={`px-2 py-1 rounded-full border text-[10px] font-black ${autoDj ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-slate-700 text-slate-400"}`}>
            {autoDj ? "AUTOMATION ARMED" : "MANUAL CONTROL"}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="ml-auto h-8 px-3 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Brain
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 font-mono">
            Gateway: {error}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
            <Stat label="Unique Tracks" value={snapshot?.quality?.unique_track_count ?? snapshot?.tracks?.length ?? 0} sub={duplicateCount ? `${duplicateCount} duplicate rows ignored` : "catalog clean"} />
            <Stat label="Playable" value={plan?.playable_count || 0} sub={`${plan?.blocked_count || 0} source-blocked`} />
            <Stat label="Crowd" value={`${energy}/10`} sub="live energy input" />
            <Stat label="Jukebox" value={pending} sub="pending requests" />
            <Stat label="Performer" value={activeEntertainer?.stage_name || "Floor"} sub={activeEntertainer ? "active NUPS shift" : "no performer shift linked"} />
            <Stat label="Persona" value={activePersona?.name || "Default"} sub={activePersona?.risk_tolerance || "balanced fallback"} />
            <Stat label="Confidence" value={`${plan?.confidence || 0}%`} sub={lastUpdated ? `updated ${new Date(lastUpdated).toLocaleTimeString()}` : "awaiting snapshot"} />
          </div>
        )}

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-2">
          <div className="rounded-xl border border-violet-500/25 bg-slate-950/70 p-3 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-300" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-black">Next Decision</span>
            </div>
            {next ? (
              <>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${next.playable ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                    {next.playable ? <Zap className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-white truncate">{next.track?.title || "Unknown"}</div>
                    <div className="text-xs text-slate-400 truncate">{next.track?.artist || "Unknown artist"} · score {next.score}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="rounded border border-cyan-500/20 bg-cyan-500/5 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300">fade {transition.fade_seconds || 6}s</span>
                      <span className="rounded border border-violet-500/20 bg-violet-500/5 px-1.5 py-0.5 text-[9px] font-mono text-violet-300">BPM Δ {transition.bpm_delta ?? 'n/a'}</span>
                      <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">energy Δ {transition.energy_delta ?? 'n/a'}</span>
                      <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase ${transition.label === 'smooth' ? 'border-emerald-500/25 text-emerald-300' : transition.label === 'hard' ? 'border-amber-500/25 text-amber-300' : 'border-slate-700 text-slate-400'}`}>{transition.label || 'open'}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1 line-clamp-2">{next.reason}</div>
                  </div>
                </div>
                {!next.playable && (
                  <div className="mt-2 text-[10px] text-amber-300/90 border-t border-amber-500/15 pt-2">
                    Automation will not play this record until it has a valid YouTube video or uploaded audio source.
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-slate-500">No recommendation yet.</div>
            )}
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-950/60 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-4 h-4 text-cyan-300" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-black">Upcoming Queue</span>
            </div>
            <div className="space-y-1.5">
              {(plan?.queue || []).slice(0, 4).map((candidate, index) => (
                <div key={candidate.track.id} className="flex items-center gap-2 text-xs">
                  <span className="w-5 text-right font-mono text-slate-600">{index + 1}</span>
                  <span className="flex-1 text-slate-300 truncate">{candidate.track.title}</span>
                  <span className="font-mono text-cyan-300">{candidate.score}</span>
                </div>
              ))}
              {!plan?.queue?.length && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Activity className="w-3.5 h-3.5" /> Add playable sources to arm the queue.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
