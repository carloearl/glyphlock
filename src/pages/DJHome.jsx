import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UnifiedMusicConsole from "@/components/mixer/UnifiedMusicConsole";
import { DJSessionProvider } from "@/components/mixer/session/DJSessionProvider";
import DJDiagnosticsPanel from "@/components/mixer/diagnostics/DJDiagnosticsPanel";
import { Badge } from "@/components/ui/badge";
import { Activity, Disc3, LogOut, Tv } from "lucide-react";

import ModeToggle from '@/components/nups/shell/ModeToggle';
import AudioIOPreferences from '@/components/mixer/AudioIOPreferences';
import NUPSOperatorAssistant from '@/components/nups/shell/NUPSOperatorAssistant';
import NUPSActionSafety from '@/components/nups/shell/NUPSActionSafety';
// DACO-NUPS-ROLE-SELECTION — DJ workspace: the Auto-DJ console ONLY.
// No dashboard, no accounting, no contracts, no back-office navigation.
export default function DJHome() {
  const navigate = useNavigate();
  const [operator, setOperator] = useState(null);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [diagnosticsRunId, setDiagnosticsRunId] = useState(0);

  useEffect(() => {
    try {
      const op = sessionStorage.getItem("nups_kiosk_operator");
      if (op) setOperator(JSON.parse(op));
    } catch { /* no operator context */ }
  }, []);

  return (
    <DJSessionProvider>
      <NUPSActionSafety />
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-violet-900/50 bg-slate-900/80 px-4 py-3 flex flex-wrap items-center gap-3">
        <Disc3 className="w-6 h-6 text-violet-400 animate-spin" style={{ animationDuration: "5s" }} />
        <div>
          <h1 className="text-lg font-bold leading-tight">DJ Booth</h1>
          {operator && <p className="text-xs text-slate-400">{operator.name} · {operator.role}</p>}
        </div>
        <Badge className="bg-violet-800 text-white">AUTO-DJ</Badge>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <AudioIOPreferences />
          <button
            onClick={() => {
              setDiagnosticsOpen(true);
              setDiagnosticsRunId((value) => value + 1);
            }}
            className="flex items-center gap-2 h-11 px-4 rounded-xl bg-violet-950/70 border border-violet-500/40 text-violet-200 text-sm font-semibold hover:bg-violet-900/70 transition-colors"
          >
            <Activity className="w-4 h-4" /> Run Diagnostics
          </button>
          <button
            onClick={() => navigate("/ClubTV")}
            className="flex items-center gap-2 h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold"
          >
            <Tv className="w-4 h-4" /> Club TV
          </button>
          <button
            onClick={() => navigate("/NUPSKiosk?panel=clockOut")}
            className="flex items-center gap-2 h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" /> Clock Out
          </button>
        </div>
      </header>

      <DJDiagnosticsPanel
        open={diagnosticsOpen}
        onOpenChange={setDiagnosticsOpen}
        runId={diagnosticsRunId}
      />

      <main className="p-4 max-w-[1600px] mx-auto">
        <UnifiedMusicConsole />
      </main>
    </div>

      <NUPSOperatorAssistant />
    </DJSessionProvider>
  );
}