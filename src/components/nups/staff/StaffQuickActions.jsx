/**
 * W3-012B Cycle 1 (Staff) — StaffQuickActions
 * ────────────────────────────────────────────
 * Role-aware station tiles. Each staff role sees ITS stations —
 * VIP Hostess gets the VIP Sale desk, Doorman gets the handheld
 * ID Scanner, Bartender the Bar Register, DJ the booth — instead of
 * everyone seeing the front-door set.
 *
 * Pure navigation: react-router links only. Every destination keeps its
 * own route guard (NUPSRouteGuard / RoleClassGuard) — this component
 * grants no access, it only improves discoverability.
 */
import React from "react";
import { Link } from "react-router-dom";
import {
  DoorOpen, Mic2, ShoppingCart, Truck, ReceiptText,
  ScanLine, Crown, Beer, Disc3,
} from "lucide-react";

const STATIONS = {
  frontDoor:  { to: "/FrontDoor",          label: "Front Door",           hint: "Guests, drivers & cover",              icon: DoorOpen,     tone: "border-emerald-500/30 hover:border-emerald-400/60 text-emerald-300" },
  idScanner:  { to: "/MobileScanner",      label: "ID Scanner",           hint: "Handheld — scan & verify guest IDs",   icon: ScanLine,     tone: "border-blue-500/30 hover:border-blue-400/60 text-blue-300" },
  vipSale:    { to: "/VIPSale",            label: "VIP Sale Desk",        hint: "Hostess access — suites & contracts",  icon: Crown,        tone: "border-purple-500/30 hover:border-purple-400/60 text-purple-300" },
  checkIn:    { to: "/EntertainerCheckIn", label: "Entertainer Check-In", hint: "PIN station for talent",               icon: Mic2,         tone: "border-pink-500/30 hover:border-pink-400/60 text-pink-300" },
  register:   { to: "/Register",           label: "Register",             hint: "Ring up cover & sales",                icon: ShoppingCart, tone: "border-cyan-500/30 hover:border-cyan-400/60 text-cyan-300" },
  barRegister:{ to: "/BarRegister",        label: "Bar Register",         hint: "Drinks, tabs & bar sales",             icon: Beer,         tone: "border-orange-500/30 hover:border-orange-400/60 text-orange-300" },
  djBooth:    { to: "/DJHome",             label: "DJ Booth",             hint: "Decks, jukebox & crowd",               icon: Disc3,        tone: "border-fuchsia-500/30 hover:border-fuchsia-400/60 text-fuchsia-300" },
  drivers:    { to: "/DriverPayouts",      label: "Driver Payouts",       hint: "Log drop-offs & payouts",              icon: Truck,        tone: "border-amber-500/30 hover:border-amber-400/60 text-amber-300" },
  receipts:   { to: "/Receipts",           label: "Receipts",             hint: "Tonight's transaction log",            icon: ReceiptText,  tone: "border-violet-500/30 hover:border-violet-400/60 text-violet-300" },
};

// Role → the stations that role actually works.
const ROLE_STATIONS = {
  DOOR_GIRL:  ["frontDoor", "register", "checkIn", "drivers", "receipts"],
  DOORMAN:    ["frontDoor", "idScanner", "drivers", "receipts"],
  SECURITY:   ["frontDoor", "idScanner", "receipts"],
  HOSTESS:    ["vipSale", "checkIn", "receipts"],
  FLOOR_HOST: ["vipSale", "frontDoor", "receipts"],
  BARTENDER:  ["barRegister", "receipts"],
  DJ:         ["djBooth", "receipts"],
};

// Unknown role / manager-admin support view — show everything.
const ALL = Object.keys(STATIONS);

export default function StaffQuickActions({ role }) {
  const keys = ROLE_STATIONS[(role || "").toUpperCase()] || ALL;

  return (
    <section aria-label="Your stations">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Your Stations</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {keys.map((k) => {
          const { to, label, hint, icon: Icon, tone } = STATIONS[k];
          return (
            <Link
              key={k}
              to={to}
              className={`flex items-center gap-4 rounded-2xl border bg-white/[0.02] p-4 min-h-[72px] transition-all active:scale-[0.98] hover:bg-white/[0.04] ${tone}`}
            >
              <Icon className="w-7 h-7 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <div className="font-bold text-white text-base leading-tight">{label}</div>
                <div className="text-[11px] text-slate-400 truncate">{hint}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}