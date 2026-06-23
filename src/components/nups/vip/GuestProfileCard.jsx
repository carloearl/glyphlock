import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard, Phone, Mail, Repeat, DollarSign, Crown, Star,
  DoorOpen, ShieldCheck, AlertTriangle, Clock, Calendar, Loader2,
} from "lucide-react";
import { format } from "date-fns";

/**
 * GuestProfileCard
 *
 * One-glance VIP-contract guest snapshot. Given a VIPGuest record (selected
 * from the door register), it auto-pulls:
 *   • Live door-register status (in_building / vip / banned / left)
 *   • Card on file + last-known approval code
 *   • Visit history & lifetime spend
 *   • Any *currently active* VIPRoom session that already has this guest
 *   • Durable GuestProfile match (the dedup-hashed permanent record)
 *
 * The hostess sees, before printing a single contract, whether this guest is
 * cleared at the door, already in a room, has a card on file, and what they've
 * historically spent — so the contract flow is grounded in real-time data
 * instead of a free-text guess.
 */
const TIER_META = {
  whale:       { label: "🐋 Whale",       cls: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  high_roller: { label: "⭐ High Roller", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  standard:    { label: "Standard",       cls: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
};

const STATUS_META = {
  in_building:   { label: "In Building",  cls: "bg-green-500/15 text-green-300 border-green-500/30",  icon: ShieldCheck },
  vip:           { label: "VIP",           cls: "bg-purple-500/15 text-purple-300 border-purple-500/30", icon: Crown },
  left_building: { label: "Left Building", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30", icon: Clock },
  banned:        { label: "Banned",        cls: "bg-red-500/15 text-red-300 border-red-500/30",       icon: AlertTriangle },
};

function Row({ icon: Icon, label, value, accent = "text-white" }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
      <span className="text-gray-500 w-24 flex-shrink-0">{label}</span>
      <span className={`font-semibold ${accent} break-all`}>{value}</span>
    </div>
  );
}

export default function GuestProfileCard({ guest }) {
  // Live: is this guest currently in an active VIP room?
  const { data: activeRoom, isLoading: roomLoading } = useQuery({
    queryKey: ["vip-active-room-for-guest", guest?.id, guest?.guest_id],
    enabled: !!guest,
    queryFn: async () => {
      if (!guest) return null;
      const occupied = await base44.entities.VIPRoom.filter({ status: "occupied" }, null, 50);
      const needle = (guest.full_name || "").toLowerCase().trim();
      return occupied.find(
        (r) =>
          (r.guest_name || "").toLowerCase().trim() === needle ||
          r.guest_id === guest.guest_id
      ) || null;
    },
    refetchInterval: 15000,
  });

  // Durable record (lives in GuestProfile entity — survives demo wipes)
  const { data: durable } = useQuery({
    queryKey: ["guest-profile-durable", guest?.guest_id],
    enabled: !!guest?.guest_id,
    queryFn: async () => {
      const rows = await base44.entities.GuestProfile.filter({ guest_id: guest.guest_id }, null, 1);
      return rows?.[0] || null;
    },
  });

  if (!guest) return null;

  const tierMeta = TIER_META[guest.tier] || TIER_META.standard;
  const statusMeta = STATUS_META[guest.status] || STATUS_META.in_building;
  const StatusIcon = statusMeta.icon;
  const inActiveRoom = !!activeRoom;
  const elapsedMins = activeRoom?.start_time
    ? Math.round((Date.now() - new Date(activeRoom.start_time).getTime()) / 60000)
    : 0;

  return (
    <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-slate-900 to-purple-950/30 overflow-hidden">
      {/* Top bar */}
      <div className="px-4 py-3 bg-black/30 border-b border-purple-500/20 flex items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-white font-bold text-base truncate">{guest.full_name}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Profile auto-loaded from door register</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className={`${statusMeta.cls} text-[10px] flex items-center gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {statusMeta.label}
          </Badge>
          <Badge className={`${tierMeta.cls} text-[10px]`}>{tierMeta.label}</Badge>
        </div>
      </div>

      {/* Live room banner */}
      {roomLoading ? (
        <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800 flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="w-3 h-3 animate-spin" /> Checking live room status…
        </div>
      ) : inActiveRoom ? (
        <div className="px-4 py-2 bg-red-950/30 border-b border-red-500/30 flex items-center gap-2 text-xs">
          <DoorOpen className="w-3.5 h-3.5 text-red-400" />
          <span className="text-red-300 font-bold">Currently in {activeRoom.room_name || `Room ${activeRoom.room_number}`}</span>
          <span className="text-gray-400">· {elapsedMins} min · ${(((activeRoom.rate_per_hour || 300) * elapsedMins) / 60).toFixed(2)} running</span>
        </div>
      ) : (
        <div className="px-4 py-2 bg-green-950/20 border-b border-green-500/20 flex items-center gap-2 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-300">No active room — clear to open new VIP session</span>
        </div>
      )}

      {/* Body */}
      <div className="px-4 py-3 space-y-2.5">
        <Row
          icon={CreditCard}
          label="Card on file"
          value={
            guest.card_last4
              ? `${guest.card_type || "Card"} ····${guest.card_last4}${guest.card_exp ? ` · Exp ${guest.card_exp}` : ""}`
              : "— none captured"
          }
          accent={guest.card_last4 ? "text-cyan-300" : "text-gray-500"}
        />
        {guest.approval_code && (
          <Row icon={ShieldCheck} label="Last approval" value={guest.approval_code} accent="text-green-300" />
        )}
        <Row icon={Phone} label="Phone" value={guest.phone} />
        <Row icon={Mail} label="Email" value={guest.email} />
        <Row
          icon={Repeat}
          label="Visits"
          value={`${guest.visit_count || 1}× · ${guest.vip_sessions_count || 0} prior VIP`}
        />
        <Row
          icon={DollarSign}
          label="Lifetime spend"
          value={`$${Number(guest.total_spend_lifetime || 0).toLocaleString()}`}
          accent="text-emerald-300"
        />
        <Row
          icon={Calendar}
          label="First seen"
          value={guest.first_visit ? format(new Date(guest.first_visit), "MMM d, yyyy") : null}
        />
        <Row
          icon={Clock}
          label="Last visit"
          value={guest.last_visit ? format(new Date(guest.last_visit), "MMM d, yyyy · h:mm a") : null}
        />
      </div>

      {/* Footer flags */}
      <div className="px-4 py-2 bg-black/30 border-t border-purple-500/20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {guest.id_verified && (
            <Badge className="bg-green-500/15 text-green-300 border-green-500/30 text-[10px]">
              <ShieldCheck className="w-3 h-3 mr-1" /> ID Verified
            </Badge>
          )}
          {!guest.id_verified && (
            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">
              <AlertTriangle className="w-3 h-3 mr-1" /> ID not verified
            </Badge>
          )}
          {durable && (
            <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-[10px]">
              <Star className="w-3 h-3 mr-1" /> Durable profile linked
            </Badge>
          )}
        </div>
        {guest.notes && (
          <p className="text-[10px] text-gray-500 italic truncate max-w-[60%]" title={guest.notes}>
            “{guest.notes}”
          </p>
        )}
      </div>
    </div>
  );
}