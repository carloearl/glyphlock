import React, { useState } from "react";
import { Plus, RefreshCw, ScanLine, UserPlus, X } from "lucide-react";

const actions = [
  { key: "scan", label: "Scan Customer ID", icon: ScanLine },
  { key: "guest", label: "Guest Registration", icon: UserPlus },
  { key: "update", label: "Update Register", icon: RefreshCw },
];

export default function POSFloatingActionMenu({ onAction }) {
  const [open, setOpen] = useState(false);

  const selectAction = (key) => {
    setOpen(false);
    onAction(key);
  };

  return (
    <div className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-[70] flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col items-end gap-2" role="menu" aria-label="Registration commands">
          {actions.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" role="menuitem" onClick={() => selectAction(key)} className="min-h-[48px] rounded-full border border-cyan-500/40 bg-slate-950 px-4 text-sm font-bold text-white shadow-xl flex items-center gap-3 hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-cyan-400">
              <Icon className="w-5 h-5 text-cyan-300" />
              {label}
            </button>
          ))}
        </div>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Close registration commands" : "Open registration commands"} className="h-14 w-14 rounded-full bg-cyan-600 text-white shadow-[0_0_28px_rgba(6,182,212,0.45)] flex items-center justify-center hover:bg-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-300">
        {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}