import React from "react";

export default function AuditScoreGauge({ score, label, status, color = "#ff3c5a" }) {
  const r = 32;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  
  const statusClass = status === 'CRITICAL' ? 'text-red-500' : 
    status === 'BROKEN' ? 'text-red-500' :
    status === 'INCOMPLETE' ? 'text-yellow-500' :
    status === 'NEEDS WORK' ? 'text-yellow-500' :
    status === 'GOOD' ? 'text-green-500' : 'text-blue-400';

  return (
    <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-5 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />
      <div className="w-20 h-20 mx-auto mb-3 relative">
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="#1e1e2e" strokeWidth="6" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.5s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-['Bebas_Neue',sans-serif] text-2xl" style={{ color }}>
          {score}%
        </div>
      </div>
      <div className="text-[10px] tracking-[2px] uppercase text-[#6b6b8a] mb-1">{label}</div>
      <div className={`font-mono text-xs font-bold uppercase tracking-wider ${statusClass}`}>{status}</div>
    </div>
  );
}