import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

const SEVERITY_STYLES = {
  high: { border: "border-red-500/40", chip: "bg-red-500/20 text-red-300", icon: "text-red-400" },
  medium: { border: "border-amber-500/40", chip: "bg-amber-500/20 text-amber-300", icon: "text-amber-400" },
  low: { border: "border-gray-600/40", chip: "bg-gray-700/30 text-gray-300", icon: "text-gray-400" },
};

function FindingRow({ finding }) {
  const [open, setOpen] = useState(false);
  const s = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.low;

  return (
    <div className={`bg-black/40 border rounded-lg ${s.border}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2.5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertCircle className={`w-4 h-4 flex-shrink-0 ${s.icon}`} />
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate flex items-center gap-2">
              {finding.title}
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${s.chip}`}>
                {finding.severity}
              </span>
              <span className="text-[10px] text-gray-500">[{finding.code}]</span>
            </div>
            <div className="text-[11px] text-gray-500 truncate">{finding.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono font-bold text-white">{finding.count}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>
      {open && finding.sample?.length > 0 && (
        <div className="border-t border-gray-800 p-3 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">
            Sample evidence
          </div>
          {finding.sample.map((s2, i) => (
            <pre
              key={i}
              className="text-[10px] text-gray-400 bg-black/60 rounded p-2 overflow-x-auto font-mono"
            >
              {JSON.stringify(s2, null, 2).slice(0, 600)}
            </pre>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IntegrityFindingsPanel({ findings = [], onExport }) {
  return (
    <Card className="bg-gray-900/60 border-amber-500/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <AlertCircle className="w-4 h-4 text-amber-400" /> Integrity Findings
        </CardTitle>
        {findings.length > 0 && onExport && (
          <Button
            size="sm"
            variant="outline"
            onClick={onExport}
            className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 h-8 text-xs"
          >
            Export Findings
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {findings.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6 text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5" />
            No anomalies detected — audit trail clean
          </div>
        ) : (
          findings.map((f) => <FindingRow key={f.code} finding={f} />)
        )}
      </CardContent>
    </Card>
  );
}