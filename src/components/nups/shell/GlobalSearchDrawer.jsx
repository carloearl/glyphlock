import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, X, ArrowRight, Loader2 } from "lucide-react";
import { searchFeatures, loadRegistry } from "@/lib/registry/featureRegistry";

/**
 * BPAA-NUPS-MASTER-001 §4 — Global "Go to" search.
 *
 * Reads ONLY from the FeatureRegistry keystone (no hardcoded lists).
 * Cmd/Ctrl+K opens; ↑/↓ navigates; Enter goes to canonical route.
 *
 * Records search (§4 second mode) is intentionally out of scope here —
 * features-first is the spine of discoverability.
 */
export default function GlobalSearchDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [allFeatures, setAllFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  // Preload registry so the empty state shows "popular" features instantly
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    loadRegistry()
      .then(rows => setAllFeatures(rows.filter(r => r.status === "ACTIVE")))
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Live search as user types
  useEffect(() => {
    if (!open) return;
    if (!query.trim()) {
      // Empty query → show top features ordered by group then order
      setResults(allFeatures.slice(0, 12));
      return;
    }
    let cancelled = false;
    (async () => {
      const found = await searchFeatures(query, { limit: 12 });
      if (!cancelled) {
        setResults(found);
        setHighlighted(0);
      }
    })();
    return () => { cancelled = true; };
  }, [query, open, allFeatures]);

  // Keyboard: arrows, enter, escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted(h => Math.min(h + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted(h => Math.max(h - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = results[highlighted];
        if (target) goTo(target);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, highlighted]);

  const goTo = (feature) => {
    if (!feature?.route) return;
    onClose();
    setQuery("");
    navigate(feature.route);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-3 pt-3 sm:px-4 sm:pt-[10vh]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl max-h-[calc(100dvh-24px)] sm:max-h-[80dvh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: "linear-gradient(180deg, #0c1024 0%, #050818 100%)",
          border: "1px solid rgba(124,58,237,0.3)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 80px rgba(124,58,237,0.15)",
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <SearchIcon className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search features — door, ledger, drivers, tips…"
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-base"
          />
          <kbd className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-gray-500">
            ESC
          </kbd>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="p-8 flex items-center justify-center text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No features match "{query}".
            </div>
          ) : (
            <div className="py-2">
              {!query.trim() && (
                <div className="px-4 pb-2 text-[9px] uppercase tracking-[0.2em] text-gray-600 font-bold">
                  Jump to · {results.length} features
                </div>
              )}
              {results.map((feat, idx) => {
                const active = idx === highlighted;
                return (
                  <button
                    key={feat.id || feat.feature_id}
                    onClick={() => goTo(feat)}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      active
                        ? "bg-violet-500/10 border-l-2 border-l-violet-400"
                        : "border-l-2 border-l-transparent hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{feat.label}</div>
                      <div className="text-[10px] font-mono text-gray-500 truncate">
                        {feat.group} · {feat.route}
                      </div>
                    </div>
                    {active && <ArrowRight className="w-4 h-4 text-violet-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-600 font-mono">
          <span>
            <kbd className="px-1 py-0.5 rounded bg-white/[0.05] border border-white/10 mr-1">↑↓</kbd>
            navigate
            <kbd className="px-1 py-0.5 rounded bg-white/[0.05] border border-white/10 mx-1 ml-3">↵</kbd>
            open
          </span>
          <span>Reads from Feature Registry · §3 keystone</span>
        </div>
      </div>
    </div>
  );
}