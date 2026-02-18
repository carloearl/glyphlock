import React from "react";

export default function AuditIssueCard({ icon, title, description, tags = [] }) {
  const tagClass = (type) => {
    switch (type) {
      case 'critical': return 'text-red-500 border-red-500/40 bg-red-500/10';
      case 'warn': return 'text-yellow-500 border-yellow-500/40 bg-yellow-500/10';
      case 'ok': return 'text-green-500 border-green-500/40 bg-green-500/10';
      default: return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
    }
  };

  return (
    <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-lg p-4 flex gap-3 items-start hover:border-red-500/40 transition-colors">
      <div className="text-2xl flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-white mb-1">{title}</div>
        <div className="text-xs text-[#6b6b8a] leading-relaxed mb-2">{description}</div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={i} className={`font-mono text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider ${tagClass(tag.type)}`}>
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}