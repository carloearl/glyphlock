/**
 * FableControlPanel — operator controls for Fable Engine X.
 * Single Start/Stop button, theme + background + visual pickers, and an
 * independent toggle for every overlay and effect. No audio controls: this
 * feature never produces sound.
 */
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Square, ExternalLink, Mic, MicOff, Play, Activity } from "lucide-react";
import { THEMES, BACKGROUNDS, VISUALS, FONTS } from "./fableThemes";
import { MEDIA_MODES } from "./fableMedia";

const OVERLAYS = [
  ["showNowPlaying", "Now Playing"],
  ["showUpNext", "Up Next"],
  ["showMarquee", "Scrolling Marquee"],
  ["showClock", "Venue Clock"],
  ["showBpm", "BPM Readout"],
  ["showDeck", "Deck Badge"],
  ["showOnAir", "On Air Badge"],
  ["showLogo", "Fable Logo"],
  ["showBeatCounter", "4/4 Beat Counter"],
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
  onStop,
  onStart,
  onLaunch,
  stageOpen,
  micStatus,
  bpm,
  liveTrackLabel,
}) {
  const set = (key) => (value) => onChange({ ...settings, [key]: value });

  return (
    <div className="space-y-4 rounded-2xl border border-violet-500/25 bg-slate-950/80 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={running ? onStop : onStart}
          className={`flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black uppercase tracking-wider text-white ${
            running ? "bg-red-600/80 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-500"
          }`}
        >
          {running ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Stop Visualizer" : "Start Visualizer"}
        </button>
        <button
          type="button"
          onClick={onLaunch}
          className="flex h-11 items-center gap-2 rounded-xl bg-fuchsia-600 px-5 text-sm font-black uppercase tracking-wider text-white hover:bg-fuchsia-500"
        >
          <ExternalLink className="h-4 w-4" />
          {stageOpen ? "Reopen Stage Window" : "Launch Stage On 2nd Screen"}
        </button>
        <div className="ml-auto flex items-center gap-2 text-xs font-mono text-slate-400">
          {micStatus === "deck" ? (
            <><Activity className="h-4 w-4 text-cyan-400" /> Deck synced {bpm ? `${bpm} BPM` : "…"}</>
          ) : micStatus === "listening" ? (
            <><Mic className="h-4 w-4 text-emerald-400" /> Beat lock {bpm ? `${bpm} BPM` : "syncing…"}</>
          ) : micStatus === "error" ? (
            <><MicOff className="h-4 w-4 text-red-400" /> Mic unavailable</>
          ) : (
            <><MicOff className="h-4 w-4" /> Idle · silent output</>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
        <Picker
          label="Stage Backdrop"
          value={settings.mediaMode || "graphics"}
          options={MEDIA_MODES}
          onChange={set("mediaMode")}
        />
        {settings.mediaMode === "player" && (
          <div className="text-[11px] text-slate-400">
            Mirroring the live player: {liveTrackLabel || "waiting for a track…"} — video only, audio stays on the club system.
          </div>
        )}
        {settings.mediaMode === "url" && (
          <input
            type="url"
            value={settings.mediaUrl || ""}
            onChange={(e) => set("mediaUrl")(e.target.value)}
            placeholder="YouTube link, MP4/WebM URL, or any direct video URL"
            className="h-11 w-full rounded-xl border border-white/10 bg-black/50 px-3 text-sm text-white"
          />
        )}
        {settings.mediaMode !== "graphics" && (
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Video Brightness · {Math.round((Number(settings.mediaOpacity) || 1) * 100)}%
            </span>
            <input
              type="range" min="0.2" max="1" step="0.05"
              value={Number(settings.mediaOpacity) || 1}
              onChange={(e) => set("mediaOpacity")(Number(e.target.value))}
              className="w-full"
            />
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
        <div className="flex-1 min-w-[180px]">
          <div className="text-xs font-black uppercase tracking-wider text-white">Auto Mode</div>
          <div className="text-[11px] text-slate-400">
            Locks to the deck's 4/4 count and rotates theme, background and visualizer automatically.
          </div>
        </div>
        <Switch checked={!!settings.autoMode} onCheckedChange={set("autoMode")} />
        <label className="text-[11px] font-semibold text-slate-400">
          Rotate every
          <select
            value={settings.autoBars}
            onChange={(e) => set("autoBars")(Number(e.target.value))}
            className="ml-2 h-9 rounded-lg border border-white/10 bg-black/50 px-2 text-sm text-white"
          >
            {[4, 8, 16, 32, 64].map((n) => (
              <option key={n} value={n}>{n} bars</option>
            ))}
          </select>
        </label>
      </div>

      <div className={`grid gap-3 sm:grid-cols-3 ${settings.autoMode ? "opacity-50" : ""}`}>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <Picker label="Stage Font" value={settings.font} options={FONTS} onChange={set("font")} />
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Marquee Speed · {Number(settings.marqueeSpeed) || 14}s loop
          </span>
          <input
            type="range" min="4" max="40" step="1"
            value={Number(settings.marqueeSpeed) || 14}
            onChange={(e) => set("marqueeSpeed")(Number(e.target.value))}
            className="w-full"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Marquee Text
        </span>
        <input
          type="text"
          value={settings.marqueeText || ""}
          onChange={(e) => set("marqueeText")(e.target.value)}
          placeholder="Leave blank to scroll the live track · artist · venue"
          className="h-11 w-full rounded-xl border border-white/10 bg-black/50 px-3 text-sm text-white"
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