/**
 * FableControlPanel — operator controls for Fable Engine X.
 * Single Start/Stop button, theme + background + visual pickers, and an
 * independent toggle for every overlay and effect. No audio controls: this
 * feature never produces sound.
 */
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Play, Square, ExternalLink, Mic, MicOff } from "lucide-react";
import { THEMES, BACKGROUNDS, VISUALS } from "./fableThemes";

const OVERLAYS = [
  ["showNowPlaying", "Now Playing"],
  ["showUpNext", "Up Next"],
  ["showMarquee", "Scrolling Marquee"],
  ["showClock", "Venue Clock"],
  ["showBpm", "BPM Readout"],
  ["showDeck", "Deck Badge"],
  ["showOnAir", "On Air Badge"],
  ["showLogo", "Fable Logo"],
];

const EFFECTS = [
  ["trails", "Motion Trails"],
  ["bloom", "Neon Bloom"],
  ["beatFlash", "Beat Flash"],
  ["beatShake", "Beat Shake"],
  ["strobe", "Strobe On Beat"],
];

function Picker({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-white/10 bg-black/50 px-3 text-sm font-semibold text-white"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <span className="text-xs font-semibold text-slate-300">{label}</span>
      <Switch checked={!!checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function FableControlPanel({
  settings,
  onChange,
  running,
  onToggleRun,
  onPopOut,
  poppedOut,
  micStatus,
  bpm,
}) {
  const set = (key) => (value) => onChange({ ...settings, [key]: value });

  return (
    <div className="space-y-4 rounded-2xl border border-violet-500/25 bg-slate-950/80 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleRun}
          className={`flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black uppercase tracking-wider transition-colors ${
            running
              ? "bg-red-600/80 text-white hover:bg-red-600"
              : "bg-fuchsia-600 text-white hover:bg-fuchsia-500"
          }`}
        >
          {running ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Stop Visualizer" : "Start Visualizer"}
        </button>
        <button
          type="button"
          onClick={onPopOut}
          className="flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-black/40 px-4 text-sm font-bold text-slate-200 hover:bg-white/5"
        >
          <ExternalLink className="h-4 w-4" />
          {poppedOut ? "Reopen Stage Window" : "Pop Out To 2nd Screen"}
        </button>
        <div className="ml-auto flex items-center gap-2 text-xs font-mono text-slate-400">
          {micStatus === "listening" ? (
            <><Mic className="h-4 w-4 text-emerald-400" /> Beat lock {bpm ? `${bpm} BPM` : "syncing…"}</>
          ) : micStatus === "error" ? (
            <><MicOff className="h-4 w-4 text-red-400" /> Mic unavailable</>
          ) : (
            <><MicOff className="h-4 w-4" /> Idle · silent output</>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Picker label="Theme" value={settings.theme} options={THEMES}
          onChange={(v) => {
            const preset = THEMES.find((t) => t.key === v);
            onChange({ ...settings, theme: v, background: preset?.bg || settings.background });
          }} />
        <Picker label="Stage Background" value={settings.background} options={BACKGROUNDS} onChange={set("background")} />
        <Picker label="Visualizer" value={settings.visual} options={VISUALS} onChange={set("visual")} />
      </div>

      <label className="block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Reaction Intensity · {Number(settings.intensity).toFixed(1)}x
        </span>
        <input
          type="range" min="0.4" max="2" step="0.1"
          value={settings.intensity}
          onChange={(e) => set("intensity")(Number(e.target.value))}
          className="w-full"
        />
      </label>

      <div>
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Stage Overlays</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {OVERLAYS.map(([key, label]) => (
            <ToggleRow key={key} label={label} checked={settings[key]} onChange={set(key)} />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Effects</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {EFFECTS.map(([key, label]) => (
            <ToggleRow key={key} label={label} checked={settings[key]} onChange={set(key)} />
          ))}
        </div>
      </div>
    </div>
  );
}