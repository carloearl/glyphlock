import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, Plus, Trash2, RefreshCw, User, Clock, Eye, Loader2 } from "lucide-react";

const DEMO_TIERS = ["full_demo", "owner_view", "staff_view", "entertainer_view"];

export default function NUPSDemoManager() {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ username: "", full_name: "", demo_label: "", demo_tier: "full_demo", demo_expires_at: "" });
  const [saving, setSaving] = useState(false);

  const { data: demoUsers = [], isLoading, refetch } = useQuery({
    queryKey: ["demo-users"],
    queryFn: () => base44.entities.NUPSUser.filter({ is_demo: true }),
    staleTime: 30000,
  });

  const handleCreate = async () => {
    if (!form.username || !form.full_name) return;
    setSaving(true);
    await base44.entities.NUPSUser.create({
      username: form.username,
      full_name: form.full_name,
      role: "DEMO",
      is_demo: true,
      demo_tier: form.demo_tier,
      demo_label: form.demo_label,
      demo_expires_at: form.demo_expires_at || null,
      status: "active",
    });
    setForm({ username: "", full_name: "", demo_label: "", demo_tier: "full_demo", demo_expires_at: "" });
    setCreating(false);
    setSaving(false);
    refetch();
  };

  const handleDelete = async (id) => {
    await base44.entities.NUPSUser.delete(id);
    refetch();
  };

  const tierColor = (tier) => ({
    full_demo: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    owner_view: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    staff_view: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    entertainer_view: "bg-pink-500/20 text-pink-300 border-pink-500/40",
  }[tier] || "bg-gray-500/20 text-gray-300");

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-cyan-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Demo Account Manager</h1>
              <p className="text-xs text-gray-400">Manage underwriter & licensee sandbox access</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-700 text-gray-400 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => setCreating(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="w-4 h-4 mr-1" /> New Demo Account
            </Button>
          </div>
        </div>

        {/* Create Form */}
        {creating && (
          <Card className="bg-gray-900 border-cyan-500/30">
            <CardHeader><CardTitle className="text-base text-cyan-400">New Demo Account</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="bg-black border-gray-700 text-white" />
              <Input placeholder="Full Name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="bg-black border-gray-700 text-white" />
              <Input placeholder="Label (e.g. Underwriter - ABC Capital)" value={form.demo_label}
                onChange={e => setForm(f => ({ ...f, demo_label: e.target.value }))}
                className="bg-black border-gray-700 text-white" />
              <select value={form.demo_tier} onChange={e => setForm(f => ({ ...f, demo_tier: e.target.value }))}
                className="bg-black border border-gray-700 text-white rounded-md px-3 py-2 text-sm">
                {DEMO_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <Input type="datetime-local" placeholder="Expires (optional)" value={form.demo_expires_at}
                onChange={e => setForm(f => ({ ...f, demo_expires_at: e.target.value }))}
                className="bg-black border-gray-700 text-white" />
              <div className="flex gap-2 items-center">
                <Button onClick={handleCreate} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700 text-white flex-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                </Button>
                <Button variant="outline" onClick={() => setCreating(false)} className="border-gray-700 text-gray-400 flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DEMO_TIERS.map(tier => (
            <Card key={tier} className="bg-gray-900/60 border-gray-800">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-white">{demoUsers.filter(u => u.demo_tier === tier).length}</div>
                <div className="text-[10px] text-gray-400 mt-1">{tier.replace("_", " ")}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User List */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              Active Demo Accounts ({demoUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
            ) : demoUsers.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No demo accounts created yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {demoUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-gray-800">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white text-sm truncate">{u.full_name}</div>
                        <div className="text-[10px] text-gray-500 truncate">@{u.username} {u.demo_label ? `· ${u.demo_label}` : ""}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge className={`text-[10px] border ${tierColor(u.demo_tier)}`}>{u.demo_tier}</Badge>
                      {u.demo_expires_at && (
                        <Badge variant="outline" className="text-[10px] border-yellow-500/40 text-yellow-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(u.demo_expires_at).toLocaleDateString()}
                        </Badge>
                      )}
                      <Badge variant="outline" className={`text-[10px] ${u.status === "active" ? "border-green-500/40 text-green-400" : "border-red-500/40 text-red-400"}`}>
                        {u.status}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-7 w-7">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}