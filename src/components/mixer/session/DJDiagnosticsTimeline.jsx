import React, { useMemo } from "react";
import { Download, ShieldAlert, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDJSession } from "./DJSessionProvider";

function downloadSnapshot(state) {
  const snapshot = {
    exportedAt: new Date().toISOString(),
    sessionId: state.sessionId,
    activeDeck: state.activeDeck,
    crossfade: state.crossfade,
    masterMuted: state.masterMuted,
    transitionCount: state.transitionCount,
    diagnostics: state.diagnostics,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `nups-dj-diagnostics-${Date.now()}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function DJDiagnosticsTimeline({ compact = false }) {
  const { state, emergencySilence } = useDJSession();
  const recent = useMemo(() => [...state.diagnostics].reverse().slice(0, compact ? 4 : 20), [state.diagnostics, compact]);
  return (
    <section className="min-h-0 rounded-xl border border-cyan-500/25 bg-slate-950/70 p-3" aria-label="DJ diagnostics timeline">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-cyan-300" />
        <span className="text-xs font-black uppercase tracking-wider text-cyan-200">Session health</span>
        <span className="text-[10px] text-slate-500">{state.sessionId.slice(-10)} · {state.diagnostics.length}/200 events</span>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => downloadSnapshot(state)}>
            <Download className="mr-1 h-3 w-3" /> Export
          </Button>
          <Button size="sm" className="h-7 bg-red-700 text-[10px] hover:bg-red-600" onClick={emergencySilence}>
            <VolumeX className="mr-1 h-3 w-3" /> Emergency silence
          </Button>
        </div>
      </div>
      <div className="max-h-36 space-y-1 overflow-auto pr-1 text-[10px]">
        {!recent.length && <p className="text-slate-500">No provider events yet.</p>}
        {recent.map((event, index) => (
          <div key={`${event.at}-${index}`} className="grid grid-cols-[70px_1fr] gap-2 rounded bg-slate-900/80 px-2 py-1">
            <span className="font-mono text-slate-500">{new Date(event.at).toLocaleTimeString()}</span>
            <span className={event.event?.includes("error") ? "text-red-300" : "text-slate-300"}>
              {event.deck ? `Deck ${event.deck} · ` : ""}{event.event || event.providerState || "state"}
              {event.message ? ` · ${event.message}` : ""}
              {Number.isFinite(event.position) ? ` · ${Math.round(event.position)}s` : ""}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
