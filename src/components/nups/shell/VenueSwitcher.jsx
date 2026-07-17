import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { saveActiveVenue } from "@/hooks/useActiveVenue";
import { Building2, ChevronDown, Check, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Multi-venue separation — one tap to switch the active venue. Every
// venue-scoped query in the app reads the active venue, so switching here
// re-scopes the entire operator surface. Admin adds venues in Venue Settings.
export default function VenueSwitcher({ activeVenue }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [venues, setVenues] = useState([]);

  useEffect(() => {
    base44.entities.Venue.filter({ status: "active" }, "-created_date", 50)
      .then((v) => setVenues(v || []))
      .catch(() => {});
  }, []);

  const pick = (v) => {
    saveActiveVenue(v);
    setOpen(false);
    window.location.reload(); // re-scope every venue-bound query
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] transition-colors"
      >
        <Building2 className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-medium text-slate-200 truncate max-w-[140px]">
          {activeVenue?.name || activeVenue?.venue_name || "Select venue"}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-3 py-2 text-[9px] font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-slate-800">
              Venues
            </div>
            {venues.map((v) => (
              <button
                key={v.id}
                onClick={() => pick(v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[12px] text-slate-200 hover:bg-white/5 transition-colors"
              >
                <span className="flex-1 truncate">{v.name}</span>
                {activeVenue?.id === v.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </button>
            ))}
            <button
              onClick={() => { setOpen(false); navigate("/admin/venue-settings"); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[12px] text-cyan-300 hover:bg-white/5 border-t border-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Manage venues
            </button>
          </div>
        </>
      )}
    </div>
  );
}