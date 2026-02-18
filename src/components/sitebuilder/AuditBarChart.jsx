import React from "react";

export default function AuditBarChart({ title, bars = [] }) {
  const getColor = (val) => {
    if (val >= 75) return '#10b981';
    if (val >= 50) return '#f59e0b';
    return '#ff3c5a';
  };

  return (
    <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-5">
      <div className="font-mono text-[10px] uppercase tracking-[2px] text-[#6b6b8a] mb-4">// {title}</div>
      <div className="space-y-3">
        {bars.map((bar, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-white w-32 flex-shrink-0 truncate">{bar.label}</span>
            <div className="flex-1 h-2 bg-[#1e1e2e] rounded overflow-hidden">
              <div className="h-full rounded transition-all duration-1000" 
                style={{ width: `${bar.value}%`, background: bar.color || getColor(bar.value) }} />
            </div>
            <span className="font-mono text-xs w-8 text-right" style={{ color: bar.color || getColor(bar.value) }}>
              {bar.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}