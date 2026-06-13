import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

const PRESETS = [
  { key: "today", label: "Today", days: 0 },
  { key: "yesterday", label: "Yesterday", days: 1, single: true },
  { key: "7d", label: "Last 7 Days", days: 7 },
  { key: "30d", label: "Last 30 Days", days: 30 },
  { key: "mtd", label: "Month to Date", mtd: true },
];

function toYMD(d) {
  return d.toISOString().slice(0, 10);
}

export function computeRange(preset) {
  const now = new Date();
  if (preset.mtd) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: toYMD(start), end: toYMD(now) };
  }
  if (preset.single) {
    const d = new Date(now);
    d.setDate(d.getDate() - preset.days);
    const ymd = toYMD(d);
    return { start: ymd, end: ymd };
  }
  const start = new Date(now);
  start.setDate(start.getDate() - preset.days);
  return { start: toYMD(start), end: toYMD(now) };
}

export default function AccountingDateFilter({ value, onChange, activePreset, onPresetChange }) {
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-violet-400" />
        <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
          Reporting Period
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {PRESETS.map((p) => (
          <Button
            key={p.key}
            size="sm"
            variant={activePreset === p.key ? "default" : "outline"}
            onClick={() => {
              onPresetChange(p.key);
              onChange(computeRange(p));
            }}
            className={
              activePreset === p.key
                ? "bg-violet-600 hover:bg-violet-700 text-white border-violet-500"
                : "border-gray-700 text-gray-300 hover:bg-gray-800"
            }
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-800">
        <div>
          <label className="text-xs text-gray-500 block mb-1">From</label>
          <Input
            type="date"
            value={value.start || ""}
            onChange={(e) => {
              onPresetChange("custom");
              onChange({ ...value, start: e.target.value });
            }}
            className="bg-black/40 border-gray-700 text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">To</label>
          <Input
            type="date"
            value={value.end || ""}
            onChange={(e) => {
              onPresetChange("custom");
              onChange({ ...value, end: e.target.value });
            }}
            className="bg-black/40 border-gray-700 text-white"
          />
        </div>
      </div>
    </div>
  );
}