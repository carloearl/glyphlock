import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Disc3,
  Headphones,
  Layers3,
  ListMusic,
  LockKeyhole,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Waves,
} from "lucide-react";

const PREVIEW_MODULES = [
  { icon: Disc3, title: "Professional Dual Decks", detail: "Persistent Deck A and Deck B playback with cue, waveform, tempo and transition controls." },
  { icon: SlidersHorizontal, title: "Performance Mixer", detail: "Crossfader, channel levels, EQ, Auto Blend and manual override in one clear center console." },
  { icon: ListMusic, title: "Library & Queue", detail: "Search, uploaded tracks, playlists, history and deck loading without crowding the booth." },
  { icon: Waves, title: "Effects & Soundboard", detail: "Rights-safe performance effects, custom uploads and instant sample triggering." },
  { icon: Sparkles, title: "NUPS Auto-DJ", detail: "Authorized automation, venue-aware recommendations and operator-controlled transitions." },
  { icon: Radio, title: "Club TV & Fable Visuals", detail: "A separate visual output that stays synchronized without taking ownership of booth audio." },
];

export default function PublicDJTeaser() {
  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[34rem] w-[70rem] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-[100px]" />
      </div>

      <section className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/40 bg-violet-500/10 shadow-[0_0_45px_rgba(139,92,246,0.28)]">
            <LockKeyhole className="h-8 w-8 text-violet-200" />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
            GlyphLock NUPS · DJ Workspace
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            DJ Modules — Authorization Required
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Advanced DJ tools are available only to authorized NUPS operators. Verify an active NUPS
            session to use the professional decks, mixer, automated blending, effects, playlists,
            soundboard and venue performance tools.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/NUPSKiosk?panel=clockIn"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 px-6 text-sm font-black text-white shadow-lg transition hover:from-cyan-500 hover:to-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Request / Verify NUPS Authorization
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/NUPSLanding"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900/70 px-6 text-sm font-bold text-slate-200 transition hover:border-slate-400 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Learn How NUPS Access Works
            </Link>
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-slate-900/65 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Headphones className="h-5 w-5 text-cyan-300" />
              <div>
                <h2 className="font-black">Authorized DJ workstation preview</h2>
                <p className="text-xs text-slate-400">Operational controls remain protected.</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200">
              <LockKeyhole className="h-3 w-3" />
              Preview only
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_minmax(0,1fr)]">
            {["Deck A", "Mixer", "Deck B"].map((label, index) => (
              <div
                key={label}
                className={`relative min-h-52 overflow-hidden rounded-2xl border p-4 ${
                  index === 1
                    ? "border-cyan-500/30 bg-gradient-to-b from-cyan-950/40 to-slate-950"
                    : "border-violet-500/30 bg-gradient-to-b from-violet-950/40 to-slate-950"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-200">{label}</span>
                  {index === 1 ? <SlidersHorizontal className="h-4 w-4 text-cyan-300" /> : <Disc3 className="h-4 w-4 text-violet-300" />}
                </div>
                <div className="mt-5 h-16 rounded-xl border border-white/5 bg-black/40">
                  <div className="flex h-full items-end gap-1 px-3 pb-3">
                    {Array.from({ length: index === 1 ? 8 : 24 }).map((_, bar) => (
                      <span
                        key={bar}
                        className={`flex-1 rounded-full ${index === 1 ? "bg-cyan-400/40" : "bg-violet-400/40"}`}
                        style={{ height: `${18 + ((bar * 17) % 70)}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, control) => (
                    <span key={control} className="h-7 rounded-lg border border-white/5 bg-white/[0.04]" />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-[1px]">
                  <LockKeyhole className="h-7 w-7 text-white/65" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PREVIEW_MODULES.map(({ icon: Icon, title, detail }) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-slate-900/55 p-5 backdrop-blur">
              <Icon className="h-5 w-5 text-cyan-300" />
              <h3 className="mt-3 font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5 text-sm text-slate-300">
          <Layers3 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
          <p>
            Authorization is enforced by the signed NUPS kiosk session and active operator role—not
            by hiding buttons in the browser. Public visitors receive this preview only.
          </p>
        </div>
      </section>
    </main>
  );
}
