import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Eye, EyeOff, UserPlus, Trash2, Shield, Star, Music, Users, Loader2, Pencil, Check, X
} from "lucide-react";

// ─── Role Tier Config ───────────────────────────────────────────────
const ROLE_TIERS = [
  {
    tier: "admin",
    label: "Platform Admin",
    roles: ["PLATFORM_ADMIN"],
    icon: <Shield className="w-4 h-4" />,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.3)",
    description: "Full system access. Only you.",
  },
  {
    tier: "executive",
    label: "Executive / Manager",
    roles: ["VENUE_OWNER", "VENUE_MANAGER"],
    icon: <Star className="w-4 h-4" />,
    color: "#a855f7",
    bg: "rgba(168,85,247,0.1)",
    border: "rgba(168,85,247,0.3)",
    description: "Managers, floor hosts, senior staff.",
  },
  {
    tier: "staff",
    label: "Staff",
    roles: ["BARTENDER", "FLOOR_HOST", "SECURITY", "DJ", "KIOSK"],
    icon: <Users className="w-4 h-4" />,
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.1)",
    border: "rgba(6,182,212,0.3)",
    description: "Bar, security, floor, DJ, kiosk.",
  },
  {
    tier: "entertainer",
    label: "Entertainer",
    roles: ["PERFORMER"],
    icon: <Music className="w-4 h-4" />,
    color: "#ec4899",
    bg: "rgba(236,72,153,0.1)",
    border: "rgba(236,72,153,0.3)",
    description: "Performers and entertainers.",
  },
];

const ALL_ROLES = [
  "PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER",
  "FLOOR_HOST", "BARTENDER", "SECURITY", "DJ", "KIOSK", "PERFORMER"
];

const roleToTier = (roleKey) => {
  for (const t of ROLE_TIERS) {
    if (t.roles.includes(roleKey)) return t;
  }
  return ROLE_TIERS[2]; // default staff
};

// ─── Single Employee Row ─────────────────────────────────────────────
function EmployeeRow({ nupsUser, isAdmin, onDelete, onUpdate }) {
  const [pinVisible, setPinVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ full_name: nupsUser.full_name, pin: nupsUser.pin, role: nupsUser.role });
  const tier = roleToTier(nupsUser.role);

  const handleSave = () => {
    onUpdate(nupsUser.id, editData);
    setEditing(false);
  };

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 group transition-all"
      style={{ background: tier.bg, border: `1px solid ${tier.border}` }}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0"
        style={{ background: `${tier.color}25`, color: tier.color }}
      >
        {(nupsUser.full_name || nupsUser.username || "?").charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              value={editData.full_name}
              onChange={e => setEditData(d => ({ ...d, full_name: e.target.value }))}
              placeholder="Full name"
              className="h-8 w-36 text-sm bg-black/40 border-white/20 text-white"
            />
            <Input
              value={editData.pin}
              onChange={e => setEditData(d => ({ ...d, pin: e.target.value }))}
              placeholder="PIN"
              className="h-8 w-24 text-sm bg-black/40 border-white/20 text-white font-mono"
              maxLength={8}
            />
            <Select value={editData.role} onValueChange={v => setEditData(d => ({ ...d, role: v }))}>
              <SelectTrigger className="h-8 w-36 text-xs bg-black/40 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {ALL_ROLES.map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <>
            <div className="font-bold text-white text-sm truncate">{nupsUser.full_name || nupsUser.username}</div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge className="text-[10px] px-1.5 py-0 border" style={{ background: `${tier.color}18`, color: tier.color, borderColor: `${tier.color}40` }}>
                {tier.icon} <span className="ml-1">{nupsUser.role}</span>
              </Badge>
              {nupsUser.employee_id && (
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>#{nupsUser.employee_id}</span>
              )}
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${nupsUser.status === 'active' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                {nupsUser.status}
              </span>
            </div>
          </>
        )}
      </div>

      {/* PIN — admin only */}
      {isAdmin && (
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className="font-mono text-sm font-bold px-3 py-1.5 rounded-lg min-w-[64px] text-center"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: pinVisible ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}
          >
            {pinVisible ? (nupsUser.pin || "—") : "●●●●"}
          </div>
          <button
            onClick={() => setPinVisible(v => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: pinVisible ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)', color: pinVisible ? '#fbbf24' : 'rgba(255,255,255,0.35)' }}
            title={pinVisible ? "Hide PIN" : "Reveal PIN"}
          >
            {pinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <>
            <button onClick={handleSave} className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditing(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-gray-400 hover:bg-white/10 transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            {isAdmin && (
              <button onClick={() => setEditing(true)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => onDelete(nupsUser.id)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-500/60 hover:text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function NUPSUserManager({ currentUser }) {
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.role === "admin" || currentUser?._highestRole === "PLATFORM_ADMIN";

  const [newForm, setNewForm] = useState({ full_name: "", username: "", pin: "", role: "BARTENDER", employee_id: "" });
  const [showAdd, setShowAdd] = useState(false);

  const { data: nupsUsers = [], isLoading } = useQuery({
    queryKey: ['nups-users-manager'],
    queryFn: () => base44.entities.NUPSUser.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.NUPSUser.create({ ...data, status: "active" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nups-users-manager'] });
      queryClient.invalidateQueries({ queryKey: ['nups-users-for-pin'] });
      setNewForm({ full_name: "", username: "", pin: "", role: "BARTENDER", employee_id: "" });
      setShowAdd(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NUPSUser.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nups-users-manager'] });
      queryClient.invalidateQueries({ queryKey: ['nups-users-for-pin'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NUPSUser.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nups-users-manager'] });
      queryClient.invalidateQueries({ queryKey: ['nups-users-for-pin'] });
    },
  });

  // Group users by tier
  const grouped = ROLE_TIERS.map(tier => ({
    ...tier,
    users: nupsUsers.filter(u => tier.roles.includes(u.role)),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Employee Directory</h2>
          <p className="text-xs text-gray-500">{nupsUsers.length} employees registered</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAdd && isAdmin && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <div className="text-sm font-bold text-purple-300">New Employee</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block">Full Name *</label>
              <Input value={newForm.full_name} onChange={e => setNewForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Jane Smith" className="h-9 bg-black/40 border-white/15 text-white text-sm" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block">Username</label>
              <Input value={newForm.username} onChange={e => setNewForm(f => ({ ...f, username: e.target.value }))}
                placeholder="jsmith" className="h-9 bg-black/40 border-white/15 text-white text-sm" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block">PIN (4-8 digits) *</label>
              <Input value={newForm.pin} onChange={e => setNewForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                placeholder="e.g. 4821" className="h-9 bg-black/40 border-white/15 text-white font-mono text-sm" maxLength={8} />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block">Role *</label>
              <Select value={newForm.role} onValueChange={v => setNewForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="h-9 bg-black/40 border-white/15 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {ALL_ROLES.map(r => <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block">Employee ID</label>
              <Input value={newForm.employee_id} onChange={e => setNewForm(f => ({ ...f, employee_id: e.target.value }))}
                placeholder="EMP-001" className="h-9 bg-black/40 border-white/15 text-white text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate(newForm)}
              disabled={!newForm.full_name || newForm.pin.length < 4 || createMutation.isPending}
              className="px-4 py-2 rounded-xl font-bold text-sm text-white disabled:opacity-40 transition-all active:scale-95"
              style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)' }}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Employee"}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Grouped Tiers */}
      {grouped.map(tier => tier.users.length === 0 ? null : (
        <div key={tier.tier}>
          {/* Tier Header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center gap-1.5 text-sm font-black" style={{ color: tier.color }}>
              {tier.icon} {tier.label}
            </span>
            <div className="flex-1 h-px" style={{ background: `${tier.color}20` }} />
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${tier.color}15`, color: tier.color }}>
              {tier.users.length}
            </span>
          </div>

          {/* Column Headers */}
          {isAdmin && tier.users.length > 0 && (
            <div className="flex items-center gap-3 px-4 mb-1 text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
              <div className="w-10 shrink-0" />
              <div className="flex-1">Employee</div>
              <div className="w-28 text-center">PIN</div>
              <div className="w-16" />
            </div>
          )}

          <div className="space-y-2">
            {tier.users.map(u => (
              <EmployeeRow
                key={u.id}
                nupsUser={u}
                isAdmin={isAdmin}
                onDelete={(id) => deleteMutation.mutate(id)}
                onUpdate={(id, data) => updateMutation.mutate({ id, data })}
              />
            ))}
          </div>
        </div>
      ))}

      {nupsUsers.length === 0 && (
        <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.2)' }}>
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">No employees registered yet</p>
          <p className="text-xs mt-1">Click "Add Employee" to create the first one</p>
        </div>
      )}
    </div>
  );
}