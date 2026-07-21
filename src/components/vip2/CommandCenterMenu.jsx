import React from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, FileSignature, DoorOpen, Users, Search, Coins } from "lucide-react";

// UNIFIED VIP WORKSPACE — VIP Floor, Sessions, People (staff) AND Contracts
// all bind to this ONE page (owner directive 2026-07-21). The Contracts card
// now opens INSIDE the Command Center instead of navigating to a separate page.
const CARDS = [
  { key: "Rooms", title: "Rooms & Floor", desc: "Live room timers — tap a room card to edit timing & status", icon: DoorOpen, glow: "bg-purple-500/25", accent: "text-purple-300" },
  { key: "Contracts", title: "VIP Contracts", desc: "The one editable VIP contract, the sell-&-seal desk, and sealed-record search — all here", icon: FileSignature, glow: "bg-amber-500/25", accent: "text-amber-300" },
  { key: "GlyphBucks", title: "GlyphBucks Suite", desc: "Sales, redeem, press editor, ledger, inventory, search & fraud — the full GlyphBucks console", icon: Coins, glow: "bg-yellow-500/25", accent: "text-yellow-300" },
  { key: "Desk", title: "Active Sessions", desc: "Live VIP contracts & session control on the floor", icon: LayoutDashboard, glow: "bg-indigo-500/25", accent: "text-indigo-300" },
  { key: "People", title: "People", desc: "Guests & entertainers — the VIP staff surface", icon: Users, glow: "bg-emerald-500/25", accent: "text-emerald-300" },
  { key: "Search", title: "Contract Search", desc: "Find & verify sealed contracts", icon: Search, glow: "bg-sky-500/25", accent: "text-sky-300" },
];

export default function CommandCenterMenu({ onSelect }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto pt-4">
      {CARDS.map(({ key, to, title, desc, icon: Icon, glow, accent }) => (
        <button
          key={key}
          onClick={() => (to ? navigate(to) : onSelect(key))}
          className="relative overflow-hidden text-left rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 min-h-[150px] transition-all hover:border-white/25 hover:bg-white/[0.07] hover:shadow-[0_8px_40px_-12px_rgba(168,85,247,0.4)] hover:-translate-y-0.5"
        >
          <div className={`pointer-events-none absolute -top-14 -right-14 w-36 h-36 rounded-full blur-3xl ${glow}`} />
          <Icon className={`w-7 h-7 mb-3 ${accent}`} />
          <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
        </button>
      ))}
    </div>
  );
}