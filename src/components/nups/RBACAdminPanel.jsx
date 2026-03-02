import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield, UserPlus, UserMinus, RefreshCw, ChevronDown, ChevronRight,
  AlertTriangle, Check, Loader2, Settings
} from "lucide-react";

// Role badge colors per role tier
const ROLE_COLORS = {
  PLATFORM_ADMIN: "bg-red-500/20 border-red-500/50 text-red-300",
  VENUE_OWNER:    "bg-purple-500/20 border-purple-500/50 text-purple-300",
  VENUE_MANAGER:  "bg-blue-500/20 border-blue-500/50 text-blue-300",
  FLOOR_HOST:     "bg-cyan-500/20 border-cyan-500/50 text-cyan-300",
  BARTENDER:      "bg-green-500/20 border-green-500/50 text-green-300",
  SECURITY:       "bg-orange-500/20 border-orange-500/50 text-orange-300",
  DJ:             "bg-yellow-500/20 border-yellow-500/50 text-yellow-300",
  PERFORMER:      "bg-pink-500/20 border-pink-500/50 text-pink-300",
  KIOSK:          "bg-gray-500/20 border-gray-500/50 text-gray-300",
};

function RoleBadge({ roleKey, displayName }) {
  const cls = ROLE_COLORS[roleKey] || "bg-white/10 border-white/20 text-white";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${cls}`}>
      <Shield className="w-3 h-3" />
      {displayName || roleKey}
    </span>
  );
}

function AssignmentRow({ assignment, onRevoke, revoking }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 flex-wrap">
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          <span className="text-sm text-white font-medium truncate max-w-[180px]">{assignment.user_email}</span>
          <RoleBadge roleKey={assignment.role_key} displayName={assignment.role_display} />
          {assignment.venue_id && (
            <span className="text-xs text-gray-500">Venue: {assignment.venue_id}</span>
          )}
          {assignment.expires_at && (
            <span className="text-xs text-amber-400">Expires: {new Date(assignment.expires_at).toLocaleDateString()}</span>
          )}
          {assignment.is_primary && (
            <span className="text-xs text-cyan-400 font-bold">PRIMARY</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onRevoke(assignment); }}
          disabled={revoking}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-2 flex-shrink-0"
        >
          {revoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
        </Button>
      </div>
      {expanded && (
        <div className="px-4 pb-3 bg-black/30 text-xs text-gray-400 space-y-1">
          <div>Assigned by: <span className="text-white">{assignment.assigned_by || '—'}</span></div>
          <div>Assigned at: <span className="text-white">{assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleString() : '—'}</span></div>
          <div>Actions allowed: <span className="text-cyan-300">{assignment.role_actions_count || 0}</span></div>
        </div>
      )}
    </div>
  );
}

export default function RBACAdminPanel() {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newVenue, setNewVenue] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [revokingId, setRevokingId] = useState(null);
  const [seedStatus, setSeedStatus] = useState(null);
  const [filterEmail, setFilterEmail] = useState("");

  // Load all assignments + available roles
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['rbac-assignments'],
    queryFn: async () => {
      const res = await base44.functions.invoke('manageRoleAssignment', { action: 'list' });
      return res.data;
    },
  });

  const assignments = data?.assignments || [];
  const availableRoles = data?.roles || [];

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke('manageRoleAssignment', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['rbac-assignments']);
      setNewEmail(""); setNewRole(""); setNewVenue(""); setNewExpiry("");
    },
  });

  // Revoke mutation
  const revokeMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke('manageRoleAssignment', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['rbac-assignments']);
      setRevokingId(null);
    },
  });

  // Seed roles mutation
  const seedMutation = useMutation({
    mutationFn: () => base44.functions.invoke('seedPlatformRoles', {}),
    onSuccess: (res) => {
      setSeedStatus(res.data);
      queryClient.invalidateQueries(['rbac-assignments']);
    },
  });

  const handleAssign = () => {
    if (!newEmail || !newRole) return;
    assignMutation.mutate({
      action: 'assign',
      user_email: newEmail.trim(),
      role_key: newRole,
      venue_id: newVenue || undefined,
      expires_at: newExpiry || undefined,
    });
  };

  const handleRevoke = (assignment) => {
    setRevokingId(assignment.id);
    revokeMutation.mutate({
      action: 'revoke',
      user_email: assignment.user_email,
      role_key: assignment.role_key,
      venue_id: assignment.venue_id || undefined,
    });
  };

  const filteredAssignments = filterEmail
    ? assignments.filter(a => a.user_email?.toLowerCase().includes(filterEmail.toLowerCase()))
    : assignments;

  // Group by user
  const byUser = {};
  for (const a of filteredAssignments) {
    if (!byUser[a.user_email]) byUser[a.user_email] = [];
    byUser[a.user_email].push(a);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-lg font-bold text-white">RBAC Role Manager</h2>
            <p className="text-xs text-gray-400">Assign, revoke, and audit staff access roles</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-white/20 text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
          >
            {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Settings className="w-4 h-4 mr-1" />}
            Seed Roles
          </Button>
        </div>
      </div>

      {seedStatus && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
          <Check className="w-4 h-4" /> Seeded {seedStatus.seeded} roles successfully.
        </div>
      )}

      {/* Role Permission Matrix */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400 uppercase tracking-widest">Role Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-gray-500 font-medium">Role</th>
                <th className="text-center p-2 text-gray-500">POS</th>
                <th className="text-center p-2 text-gray-500">Batch</th>
                <th className="text-center p-2 text-gray-500">Reports</th>
                <th className="text-center p-2 text-gray-500">Staff Mgmt</th>
                <th className="text-center p-2 text-gray-500">VIP / Guests</th>
                <th className="text-center p-2 text-gray-500">Time Clock</th>
                <th className="text-center p-2 text-gray-500">Settings</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'PLATFORM_ADMIN', label: 'Platform Admin', pos: '✦', batch: '✦', reports: '✦', staff: '✦', vip: '✦', tc: '✦', settings: '✦' },
                { key: 'VENUE_OWNER',   label: 'Owner',          pos: '✦', batch: '✦', reports: '✦', staff: '✦', vip: '✦', tc: '✦', settings: '✦' },
                { key: 'VENUE_MANAGER', label: 'Manager',        pos: '✦', batch: '✦', reports: '✦', staff: '⊘', vip: '✦', tc: '✦', settings: '✕' },
                { key: 'FLOOR_HOST',   label: 'Floor Host',     pos: '✦', batch: '⊘', reports: '✕', staff: '✕', vip: '✦', tc: '✦', settings: '✕' },
                { key: 'BARTENDER',    label: 'Bartender',      pos: '✦', batch: '✕', reports: '✕', staff: '✕', vip: '✕', tc: '✦', settings: '✕' },
                { key: 'SECURITY',     label: 'Security',       pos: '✕', batch: '✕', reports: '✕', staff: '✕', vip: '⊘', tc: '✦', settings: '✕' },
                { key: 'DJ',           label: 'DJ',             pos: '✕', batch: '✕', reports: '✕', staff: '✕', vip: '✕', tc: '✦', settings: '✕' },
                { key: 'PERFORMER',    label: 'Performer',      pos: '✕', batch: '✕', reports: '✕', staff: '✕', vip: '✕', tc: '✦', settings: '✕' },
                { key: 'KIOSK',        label: 'Kiosk',          pos: '✦', batch: '✕', reports: '✕', staff: '✕', vip: '✕', tc: '✕', settings: '✕' },
              ].map(row => (
                <tr key={row.key} className="border-b border-white/5 hover:bg-white/3">
                  <td className="p-3"><RoleBadge roleKey={row.key} displayName={row.label} /></td>
                  {[row.pos, row.batch, row.reports, row.staff, row.vip, row.tc, row.settings].map((v, i) => (
                    <td key={i} className={`text-center p-2 font-bold ${v === '✦' ? 'text-green-400' : v === '⊘' ? 'text-amber-400' : 'text-gray-700'}`}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-600 p-3">✦ = Full &nbsp; ⊘ = Partial &nbsp; ✕ = None</p>
        </CardContent>
      </Card>

      {/* Assign New Role */}
      <Card className="bg-black/40 border-cyan-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Assign Role to Staff
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Staff Email *</Label>
              <Input
                placeholder="staff@example.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="bg-black/40 border-white/15 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Role *</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-black/40 border-white/15 text-white">
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {availableRoles.map(r => (
                    <SelectItem key={r.role_key} value={r.role_key}>
                      {r.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Venue ID (optional)</Label>
              <Input
                placeholder="Leave blank for all venues"
                value={newVenue}
                onChange={e => setNewVenue(e.target.value)}
                className="bg-black/40 border-white/15 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Expires (optional)</Label>
              <Input
                type="date"
                value={newExpiry}
                onChange={e => setNewExpiry(e.target.value)}
                className="bg-black/40 border-white/15 text-white"
              />
            </div>
          </div>
          {assignMutation.error && (
            <div className="flex items-center gap-2 text-red-400 text-xs">
              <AlertTriangle className="w-3 h-3" />
              {assignMutation.error?.message || "Assignment failed"}
            </div>
          )}
          {assignMutation.data?.data?.error && (
            <div className="flex items-center gap-2 text-amber-400 text-xs">
              <AlertTriangle className="w-3 h-3" />
              {assignMutation.data.data.error}
            </div>
          )}
          {assignMutation.data?.data?.success && (
            <div className="flex items-center gap-2 text-green-400 text-xs">
              <Check className="w-3 h-3" /> Role assigned successfully.
            </div>
          )}
          <Button
            onClick={handleAssign}
            disabled={!newEmail || !newRole || assignMutation.isPending}
            className="bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            {assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
            Assign Role
          </Button>
        </CardContent>
      </Card>

      {/* Active Assignments */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm text-gray-400 uppercase tracking-widest">
              Active Assignments ({assignments.length})
            </CardTitle>
            <Input
              placeholder="Filter by email..."
              value={filterEmail}
              onChange={e => setFilterEmail(e.target.value)}
              className="w-48 bg-black/40 border-white/10 text-white text-xs h-8"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : Object.keys(byUser).length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-sm">
              No active role assignments found.
              <br />
              <span className="text-xs text-gray-700">Click "Seed Roles" first, then assign roles above.</span>
            </div>
          ) : (
            Object.entries(byUser).map(([email, userAssignments]) => (
              <div key={email} className="space-y-1">
                <div className="text-xs text-gray-600 px-1 mt-3 first:mt-0">{email}</div>
                {userAssignments.map(a => (
                  <AssignmentRow
                    key={a.id}
                    assignment={a}
                    onRevoke={handleRevoke}
                    revoking={revokingId === a.id && revokeMutation.isPending}
                  />
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}