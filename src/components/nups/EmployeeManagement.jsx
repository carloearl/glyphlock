import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Pencil, UserX, UserCheck, Eye, EyeOff, Search, Filter
} from "lucide-react";
import { toast } from "sonner";

const ROLES = [
  { key: "PLATFORM_ADMIN", label: "Platform Admin",   color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  { key: "VENUE_OWNER",    label: "Venue Owner",       color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { key: "VENUE_MANAGER",  label: "Venue Manager",     color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  { key: "FLOOR_HOST",     label: "Floor Host",        color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  { key: "BARTENDER",      label: "Bartender",         color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { key: "SECURITY",       label: "Security",          color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  { key: "DJ",             label: "DJ",                color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  { key: "PERFORMER",      label: "Entertainer",       color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  { key: "KIOSK",          label: "Kiosk",             color: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
];

function getRoleBadge(roleKey) {
  const r = ROLES.find(r => r.key === roleKey);
  return r ? <Badge className={`text-xs ${r.color}`}>{r.label}</Badge> : <Badge className="text-xs">{roleKey}</Badge>;
}

const EMPTY_FORM = { username: "", full_name: "", pin: "", role: "BARTENDER", employee_id: "", phone: "", status: "active" };

function EmployeeDialog({ open, onClose, employee, entertainers }) {
  const [form, setForm] = useState(employee || EMPTY_FORM);
  const [showPin, setShowPin] = useState(false);
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (data) => employee?.id
      ? base44.entities.NUPSUser.update(employee.id, data)
      : base44.entities.NUPSUser.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nups-employees'] });
      toast.success(employee?.id ? "Employee updated." : "Employee created.");
      onClose();
    }
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-950 border border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">{employee?.id ? "Edit Employee" : "Add Employee"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs">Full Name *</Label>
              <Input value={form.full_name} onChange={e => set("full_name", e.target.value)}
                className="bg-white/[0.04] border-white/10 text-white mt-1" placeholder="Jane Smith" />
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Username *</Label>
              <Input value={form.username} onChange={e => set("username", e.target.value)}
                className="bg-white/[0.04] border-white/10 text-white mt-1" placeholder="jsmith" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs">Role *</Label>
              <Select value={form.role} onValueChange={v => set("role", v)}>
                <SelectTrigger className="bg-white/[0.04] border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 border-white/10">
                  {ROLES.map(r => (
                    <SelectItem key={r.key} value={r.key} className="text-white">{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="bg-white/[0.04] border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 border-white/10">
                  <SelectItem value="active" className="text-white">Active</SelectItem>
                  <SelectItem value="suspended" className="text-white">Suspended</SelectItem>
                  <SelectItem value="terminated" className="text-white">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs">Employee ID</Label>
              <Input value={form.employee_id || ""} onChange={e => set("employee_id", e.target.value)}
                className="bg-white/[0.04] border-white/10 text-white mt-1" placeholder="EMP-001" />
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Phone</Label>
              <Input value={form.phone || ""} onChange={e => set("phone", e.target.value)}
                className="bg-white/[0.04] border-white/10 text-white mt-1" placeholder="(602) 555-0100" />
            </div>
          </div>

          {/* PIN field */}
          <div>
            <Label className="text-gray-400 text-xs">Clock-In PIN (4–6 digits)</Label>
            <div className="relative mt-1">
              <Input
                type={showPin ? "text" : "password"}
                value={form.pin || ""}
                onChange={e => set("pin", e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="bg-white/[0.04] border-white/10 text-white pr-10"
                placeholder="••••"
                maxLength={6}
              />
              <button type="button" onClick={() => setShowPin(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Link to entertainer if role = PERFORMER */}
          {form.role === "PERFORMER" && (
            <div>
              <Label className="text-gray-400 text-xs">Linked Entertainer Record</Label>
              <Select value={form._entertainer_id || "__none__"} onValueChange={v => set("_entertainer_id", v === "__none__" ? "" : v)}>
                <SelectTrigger className="bg-white/[0.04] border-white/10 text-white mt-1">
                  <SelectValue placeholder="Select entertainer…" />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 border-white/10">
                  <SelectItem value="__none__" className="text-gray-400">— None —</SelectItem>
                  {(entertainers || []).map(e => (
                    <SelectItem key={e.id} value={e.id} className="text-white">{e.stage_name} ({e.legal_name})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="border-white/10 text-gray-400 flex-1">Cancel</Button>
            <Button
              onClick={() => save.mutate(form)}
              disabled={!form.full_name || !form.username || save.isPending}
              className="flex-1 bg-violet-600 hover:bg-violet-500"
            >
              {save.isPending ? "Saving…" : employee?.id ? "Save Changes" : "Create Employee"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function EmployeeManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['nups-employees'],
    queryFn: () => base44.entities.NUPSUser.list('-created_date', 200)
  });

  const { data: entertainers = [] } = useQuery({
    queryKey: ['entertainers-list'],
    queryFn: () => base44.entities.Entertainer.list()
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.NUPSUser.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nups-employees'] })
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (emp) => { setEditing(emp); setDialogOpen(true); };

  const filtered = employees.filter(e => {
    const matchSearch = !search ||
      e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.username?.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_id?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "ALL" || e.role === filterRole;
    const matchStatus = filterStatus === "ALL" || e.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  // Group by role for display
  const grouped = ROLES.map(r => ({
    ...r,
    employees: filtered.filter(e => e.role === r.key)
  })).filter(g => g.employees.length > 0);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, username, ID…"
            className="pl-9 bg-white/[0.04] border-white/10 text-white" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-40 bg-white/[0.04] border-white/10 text-white">
            <Filter className="w-3 h-3 mr-1 text-gray-400" /><SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-950 border-white/10">
            <SelectItem value="ALL" className="text-white">All Roles</SelectItem>
            {ROLES.map(r => <SelectItem key={r.key} value={r.key} className="text-white">{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 bg-white/[0.04] border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-950 border-white/10">
            <SelectItem value="ALL" className="text-white">All Status</SelectItem>
            <SelectItem value="active" className="text-white">Active</SelectItem>
            <SelectItem value="suspended" className="text-white">Suspended</SelectItem>
            <SelectItem value="terminated" className="text-white">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="bg-violet-600 hover:bg-violet-500 gap-1">
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-3 text-xs text-gray-500">
        <span>{filtered.length} employee{filtered.length !== 1 ? 's' : ''} shown</span>
        <span>·</span>
        <span className="text-green-400">{employees.filter(e => e.status === 'active').length} active</span>
        <span>·</span>
        <span className="text-orange-400">{employees.filter(e => e.status === 'suspended').length} suspended</span>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-600">Loading employees…</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-lg font-bold text-white/20">No employees found</p>
          <p className="text-sm mt-1">Add your first employee above</p>
        </div>
      ) : (
        grouped.map(group => (
          <div key={group.key}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${group.color}`}>{group.label}</span>
              <span className="text-xs text-gray-600">({group.employees.length})</span>
            </div>
            <div className="space-y-2">
              {group.employees.map(emp => (
                <Card key={emp.id} className={`bg-white/[0.03] border-white/[0.07] ${emp.status !== 'active' ? 'opacity-60' : ''}`}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{emp.full_name}</span>
                        <span className="text-gray-600 text-xs">@{emp.username}</span>
                        {emp.employee_id && <span className="text-gray-600 text-xs">#{emp.employee_id}</span>}
                        {emp.status !== 'active' && (
                          <Badge className="text-[10px] bg-orange-500/20 text-orange-300 border-orange-500/30">{emp.status}</Badge>
                        )}
                      </div>
                      {emp.phone && <div className="text-xs text-gray-500 mt-0.5">{emp.phone}</div>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openEdit(emp)}
                        className="border-white/10 text-gray-400 h-8 w-8 p-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => toggleStatus.mutate({ id: emp.id, status: emp.status === 'active' ? 'suspended' : 'active' })}
                        className={`h-8 w-8 p-0 border-white/10 ${emp.status === 'active' ? 'text-orange-400 hover:bg-orange-500/10' : 'text-green-400 hover:bg-green-500/10'}`}>
                        {emp.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      <EmployeeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        employee={editing}
        entertainers={entertainers}
      />
    </div>
  );
}