import React from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, ChevronRight } from "lucide-react";
import { ENTITY_TYPES } from "@/lib/search/searchIndex";

const COLOR_MAP = {
  yellow: "border-yellow-500/30 bg-yellow-950/20 text-yellow-300",
  emerald: "border-emerald-500/30 bg-emerald-950/20 text-emerald-300",
  blue: "border-blue-500/30 bg-blue-950/20 text-blue-300",
  pink: "border-pink-500/30 bg-pink-950/20 text-pink-300",
  violet: "border-violet-500/30 bg-violet-950/20 text-violet-300",
  amber: "border-amber-500/30 bg-amber-950/20 text-amber-300",
  purple: "border-purple-500/30 bg-purple-950/20 text-purple-300",
  red: "border-red-500/30 bg-red-950/20 text-red-300",
};

function highlight(text, query) {
  if (!text || !query || query.length < 2) return text;
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${safeQuery})`, "ig"));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-violet-500/30 text-white px-0.5 rounded">
        {p}
      </mark>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    )
  );
}

export default function SearchResultCard({ result, query }) {
  const navigate = useNavigate();
  const meta = ENTITY_TYPES[result.type] || { label: result.type, color: "blue" };
  const color = COLOR_MAP[meta.color] || COLOR_MAP.blue;
  const hasLink = !!result.deep_link;

  const handleClick = () => {
    if (hasLink) navigate(result.deep_link);
  };

  return (
    <div
      role={hasLink ? "button" : undefined}
      tabIndex={hasLink ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (hasLink && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`bg-gray-900/60 border border-gray-800 rounded-xl p-4 transition-all ${
        hasLink ? "hover:border-violet-500/40 hover:bg-gray-900/80 cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${color}`}>
            {meta.label.toUpperCase()}
          </span>
          <span className="text-xs text-gray-600 font-mono">score {result.score.toFixed(0)}</span>
        </div>
        {hasLink && <ExternalLink className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />}
      </div>

      <div className="text-base font-bold text-white truncate mb-1">
        {highlight(result.title, query)}
      </div>
      <div className="text-xs text-gray-400 truncate mb-3">
        {highlight(result.subtitle, query)}
      </div>

      {result.fields?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-800">
          {result.fields.map((f, i) => (
            <div key={i} className="text-[10px]">
              <div className="text-gray-600 uppercase tracking-wider font-bold">{f.label}</div>
              <div className="text-gray-300 font-mono truncate">{f.value}</div>
            </div>
          ))}
        </div>
      )}

      {hasLink && (
        <div className="flex items-center gap-1 text-[10px] text-violet-400 mt-2 pt-2 border-t border-gray-800">
          Open {result.deep_link} <ChevronRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}