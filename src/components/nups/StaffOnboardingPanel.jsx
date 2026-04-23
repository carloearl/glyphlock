import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, Eye, EyeOff, Pencil, Check, X, ToggleLeft, ToggleRight } from "lucide-react";

const ROLES = [
  "VENUE_MANAGER", "BARTENDER", "FLOOR_HOST", "SECURITY", "DJ", "HOSTESS", "DOOR_GIRL"
];

import { DEFAULT_VENUE_ID, DEFAULT_VENUE_NAME, resolveVenueId } from "@/lib/venueDefaults";

const EMPTY_FORM = { display_name: "", username: "", pin: "", role: "FLOOR_HOST", venue_id: DEFAULT_VENUE_ID };

export default function StaffOnboardingPanel() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPin, setShowPin] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editPin, setEditPin] = useState("");
  const [showEditPin, setShowEditPin] = useState(false);

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ["nups-users"],
    queryFn: () => base44.entities.NUPSUser.list("-created_date", 100),
  });

  const createStaff = useMutation({
    mutationFn: (data) => base44.entities.NUPSUser.create({
      ...data,
      // Always route live-system onboards to Dream Palace DB when no venue is specified
      venue_id: resolveVenueId(data.venue_id),
      is_active: true,
      created_by_manager: true,
    }),
    onSuccess: () => {
      qc.invalidateQueries(["nups-users"]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    },
  });

  const updateStaff = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NUPSUser.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries(["nups-users"]);
      setEditingId(null);
      setEditPin("");
    },
  });

  const roleColor = (role) => {
    const map = {
      VENUE_MANAGER: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      BARTENDER: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      SECURITY: "bg-red-500/20 text-red-300 border-red-500/40",
      DJ: "bg-pink-500/20 text-pink-300 border-pink-500/40",
      FLOOR_HOST: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
      HOSTESS: "bg-green-500/20 text-green-300 border-green-500/40",
      DOOR_GIRL: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    };
    return map[role] || "bg-gray-500/20 text-gray-300 border-gray-500/40";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-bold text-lg">Staff Onboarding & PINs</h3>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
          size="sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="bg-gray-900/80 border-purple-500/40">
          <CardHeader><CardTitle className="text-white text-base">New Staff Account</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Display Name</label>
                <Input
                  placeholder="e.g. Jessica"
                  value={form.display_name}
                  onChange={e => setForm(v => ({ ...v, display_name: e.target.value }))}
                  className="bg-black/50 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Username (login ID)</label>
                <Input
                  placeholder="e.g. jessica.bar"
                  value={form.username}
                  onChange={e => setForm(v => ({ ...v, username: e.target.value.toLowerCase().replace(/\s/g, '.') }))}
                  className="bg-black/50 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">PIN / Password</label>
                <div className="relative">
                  <Input
                    type={showPin ? "text" : "password"}
                    placeholder="4–8 digits"
                    value={form.pin}
                    onChange={e => setForm(v => ({ ...v, pin: e.target.value }))}
                    className="bg-black/50 border-gray-700 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >{showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(v => ({ ...v, role: e.target.value }))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block flex items-center gap-2">
                Venue ID
                <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wide">
                  Default: {DEFAULT_VENUE_NAME}
                </span>
              </label>
              <Input
                placeholder={DEFAULT_VENUE_ID}
                value={form.venue_id}
                onChange={e => setForm(v => ({ ...v, venue_id: e.target.value }))}
                className="bg-black/50 border-gray-700 text-white"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Leave as <code className="text-purple-300">{DEFAULT_VENUE_ID}</code> to save to the Dream Palace DB.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => createStaff.mutate(form)}
                disabled={!form.username || !form.pin || !form.display_name || createStaff.isPending}
                className="bg-green-700 hover:bg-green-600 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                {createStaff.isPending ? "Creating..." : "Create Account"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-gray-700 text-gray-400">
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff List */}
      <Card className="bg-gray-900/60 border-gray-700/50">
        <CardContent className="p-4">
          {isLoading && <p className="text-gray-500 text-sm">Loading staff...</p>}
          {!isLoading && staffList.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-6">No staff accounts yet. Add one above.</p>
          )}
          <div className="space-y-2">
            {staffList.map(staff => (
              <div key={staff.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">{staff.display_name || staff.username}</span>
                      <Badge className={`text-[10px] ${roleColor(staff.role)}`}>{staff.role?.replace(/_/g, ' ')}</Badge>
                      {!staff.is_active && <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px]">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">@{staff.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingId === staff.id ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Input
                          type={showEditPin ? "text" : "password"}
                          placeholder="New PIN"
                          value={editPin}
                          onChange={e => setEditPin(e.target.value)}
                          className="bg-black/50 border-gray-700 text-white text-sm w-28 pr-8"
                        />
                        <button type="button" onClick={() => setShowEditPin(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                          {showEditPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                      <Button size="sm" onClick={() => updateStaff.mutate({ id: staff.id, data: { pin: editPin } })}
                        disabled={!editPin} className="bg-green-700 hover:bg-green-600 text-white h-8 px-2">
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditPin(""); }}
                        className="text-gray-500 h-8 px-2"><X className="w-3 h-3" /></Button>
                    </div>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingId(staff.id); setEditPin(""); }}
                        className="text-gray-400 hover:text-white h-8 px-2" title="Change PIN">
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost"
                        onClick={() => updateStaff.mutate({ id: staff.id, data: { is_active: !staff.is_active } })}
                        className={`h-8 px-2 ${staff.is_active ? 'text-green-400 hover:text-red-400' : 'text-gray-600 hover:text-green-400'}`}
                        title={staff.is_active ? "Deactivate" : "Activate"}>
                        {staff.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}