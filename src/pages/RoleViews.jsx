import React from "react";
import { useNavigate } from "react-router-dom";
import {
  DoorOpen, Crown, ShieldCheck, Music, ShoppingCart, Mic2,
  Clock, LayoutDashboard, KeyRound, ChevronRight, Eye,
} from "lucide-react";

// DACO-NUPS-FINAL-LAUNCH — Admin/Owner role-view selector.
// After back-office sign-in, admins choose which role's live workspace to
// open: each card is the exact surface that role sees, not a mockup.
const VIEWS = [
  { label: "Front Door", pov: "Door Girl / Doorman view", icon: DoorOpen, to: "/FrontDoor", color: "border-cyan-500/40", iconColor: "text-cyan-400" },
  { label: "VIP Sale", pov: "Hostess / Floor Host view", icon: Crown, to: "/VIPSale", color: "border-pink-500/40", iconColor: "text-pink-400" },
  { label: "Manager Console", pov: "Venue Manager view", icon: ShieldCheck, to: "/ManagerConsole", color: "border-blue-500/40", iconColor: "text-blue-400" },
  { label: "DJ Console", pov: "DJ view", icon: Music, to: "/NUPSOwner?tab=dj", color: "border-violet-500/40", iconColor: "text-violet-400" },
  { label: "Register", pov: "Bartender / POS view", icon: ShoppingCart, to: "/Register", color: "border-emerald-500/40", iconColor: "text-emerald-400" },
  { label: "Entertainer Check-In", pov: "Entertainer view", icon: Mic2, to: "/EntertainerCheckIn", color: "border-rose-500/40", iconColor: "text-rose-400" },
  { label: "Clock Station", pov: "Security / Driver view", icon: Clock, to: "/NUPSKiosk", color: "border-slate-500/40", iconColor: "text-slate-400" },
  { label: "Owner Dashboard", pov: "Full back office", icon: LayoutDashboard, to: "/NUPSHub", color: "border-amber-500/40", iconColor: "text-amber-400" },
  { label: "Admin Portal", pov: "System administration", icon: KeyRound, to: "/NUPSAdminPortal", color: "border-indigo-500/40", iconColor: "text-indigo-400" },
];

export default function RoleViews() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Eye className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black">Choose a View</h1>
          <p className="text-slate-500 text-sm mt-1">
            Open any workspace exactly as that role sees it
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {VIEWS.map((v) => (
            <button
              key={v.label}
              onClick={() => navigate(v.to)}
              className={`flex items-center gap-4 p-5 rounded-2xl bg-slate-900/80 border ${v.color} text-left hover:bg-slate-800/80 transition-colors active:scale-[0.99]`}
            >
              <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <v.icon className={`w-5 h-5 ${v.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white">{v.label}</div>
                <div className="text-slate-500 text-xs mt-0.5">{v.pov}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}