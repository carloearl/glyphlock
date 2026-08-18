import React from "react";
import { ScanLine, AlertTriangle, X } from "lucide-react";

/**
 * Read-only confirmation of exactly which fields the ID scan captured, so the
 * door operator can verify the data landed in the right places before check-in.
 */
export default function ScannedIdSummary({ scan, onDismiss }) {
  if (!scan) return null;

  const rows = [
    ["Name", scan.full_name],
    ["Date of Birth", scan.date_of_birth],
    ["ID Number", scan.id_number],
    ["Issuing State", scan.id_state],
    ["Expires", scan.id_expiration],
    ["Address", [scan.address_line1, scan.city, scan.state, scan.zip_code].filter(Boolean).join(", ")],
  ].filter(([, value]) => value);

  return (
    <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <ScanLine className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
          Captured from ID
        </span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-auto text-slate-500 hover:text-slate-300"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {scan.id_expired && (
        <div className="mb-2 flex items-center gap-1.5 rounded bg-red-500/15 border border-red-500/40 px-2 py-1.5 text-[11px] font-bold text-red-300">
          <AlertTriangle className="w-3 h-3 shrink-0" /> ID EXPIRED — verify manually
        </div>
      )}

      <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-2 text-[11px]">
            <dt className="text-slate-500 shrink-0">{label}</dt>
            <dd className="font-mono font-semibold text-slate-200 text-right truncate">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}