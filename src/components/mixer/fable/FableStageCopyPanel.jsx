/**
 * FableStageCopyPanel — typed stage copy + typography controls.
 * Operator types the dancer on stage, who is up next, and tunes text size,
 * marquee font, marquee size and scroll direction.
 */
import React from "react";
import { FONTS } from "./fableThemes";
import { TEXT_FX } from "./fableTextFx";
import { HEADLINE_MOTIONS } from "./fableHeadlineMotion";

function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-white/10 bg-black/50 px-3 text-sm font-semibold text-white"
      />
    </label>
  );
}

export default function FableStageCopyPanel({ settings, onChange }) {
  const set = (key) => (value) => onChange({ ...settings, [key]: value });

  return (
    <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Center Headline</div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Headline Line 1" value={settings.headline1} onChange={set("headline1")} placeholder="Dream Palace" />
        <Field label="Headline Line 2" value={settings.headline2} onChange={set("headline2")} placeholder="VIP Showroom" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Headline Font</span>
          <select
            value={settings.headlineFont || settings.font}
            onChange={(e) => set("headlineFont")(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/50 px-3 text-sm font-semibold text-white"
          >
            {FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Headline Effect</span>
          <select
            value={settings.headlineFx || "neon"}
            onChange={(e) => set("headlineFx")(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/50 px-3 text-sm font-semibold text-white"
          >
            {TEXT_FX.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Headline Motion</span>
          <select
            value={settings.headlineMotion || "none"}
            onChange={(e) => set("headlineMotion")(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/50 px-3 text-sm font-semibold text-white"
          >
            {HEADLINE_MOTIONS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Headline Size · {Number(settings.headlineSize) || 96}px
          </span>
          <input
            type="range" min="32" max="220" step="2"
            value={Number(settings.headlineSize) || 96}
            onChange={(e) => set("headlineSize")(Number(e.target.value))}
            className="w-full"
          />
        </label>
      </div>

      <div className="pt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Stage Copy</div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="On Stage Now"
          value={settings.dancerName}
          onChange={set("dancerName")}
          placeholder="Dancer name"
        />
        <Field
          label="Up Next"
          value={settings.upNextName}
          onChange={set("upNextName")}
          placeholder="Leave blank to show the queued track"
        />
      </div>

      <Field
        label="On Stage Label"
        value={settings.dancerLabel}
        onChange={set("dancerLabel")}
        placeholder="On Stage"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Stage Text Size · {Math.round((Number(settings.fontScale) || 1) * 100)}%
          </span>
          <input
            type="range" min="0.6" max="2.5" step="0.05"
            value={Number(settings.fontScale) || 1}
            onChange={(e) => set("fontScale")(Number(e.target.value))}
            className="w-full"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Marquee Text Size · {Number(settings.marqueeSize) || 13}px
          </span>
          <input
            type="range" min="10" max="64" step="1"
            value={Number(settings.marqueeSize) || 13}
            onChange={(e) => set("marqueeSize")(Number(e.target.value))}
            className="w-full"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Marquee Font</span>
          <select
            value={settings.marqueeFont || settings.font}
            onChange={(e) => set("marqueeFont")(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/50 px-3 text-sm font-semibold text-white"
          >
            {FONTS.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Scroll Direction</span>
          <select
            value={settings.marqueeDirection || "ltr"}
            onChange={(e) => set("marqueeDirection")(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/50 px-3 text-sm font-semibold text-white"
          >
            <option value="ltr">Left → Right</option>
            <option value="rtl">Right → Left</option>
          </select>
        </label>
      </div>
    </div>
  );
}