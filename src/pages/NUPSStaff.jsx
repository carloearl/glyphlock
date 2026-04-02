import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Clock, DollarSign, AlertCircle, Trash2, Edit2 } from "lucide-react";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function NUPSStaff() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([
    { id: 1, name: "Alex Rivera", role: "Manager", email: "alex@nups.local", status: "active", hourlyRate: 22.50, shiftsThisMonth: 45 },
    { id: 2, name: "Jamie Chen", role: "Bartender", email: "jamie@nups.local", status: "active", hourlyRate: 16.00, shiftsThisMonth: 38 },
    { id: 3, name: "Casey Williams", role: "DJ", email: "casey@nups.local", status: "active", hourlyRate: 20.00, shiftsThisMonth: 28 },
    { id: 4, name: "Morgan Lee", role: "Door Staff", email: "morgan@nups.local", status: "inactive", hourlyRate: 15.50, shiftsThisMonth: 0 },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", role: "", email: "", hourlyRate: "" });

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStaff = () => {
    if (formData.name && formData.role && formData.email && formData.hourlyRate) {
      setStaff([...staff, {
        id: Date.now(),
        ...formData,
        hourlyRate: parseFloat(formData.hourlyRate),
        status: "active",
        shiftsThisMonth: 0
      }]);
      setFormData({ name: "", role: "", email: "", hourlyRate: "" });
      setShowAddForm(false);
    }
  };

  const handleDeleteStaff = (id) => {
    setStaff(staff.filter(s => s.id !== id));
  };

  const handleToggleStatus = (id) => {
    setStaff(staff.map(s =>
      s.id === id ? { ...s, status: s.status === "active" ? "inactive" : "active" } : s
    ));
  };

  return (
    <NUPSRouteGuard requiredRoles={["VENUE_MANAGER", "PLATFORM_ADMIN", "VENUE_OWNER"]}>
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] p-4 bg-black/95 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-gray-600 hover:text-gray-400">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Clock className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="font-bold text-white text-sm">N.U.P.S. Staff Management</div>
              <div className="text-[10px] text-cyan-400">{staff.filter(s => s.status === "active").length} active staff</div>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 text-xs h-8 px-3 gap-1.5 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Staff
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* Search */}
        <div className="mb-4">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/[0.05] border-white/[0.1] text-white"
          />
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.07] space-y-3">
            <div className="grid md:grid-cols-4 gap-3">
              <Input
                placeholder="Full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/[0.05] border-white/[0.1] text-white"
              />
              <Input
                placeholder="Role (Manager, Bartender, etc)"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="bg-white/[0.05] border-white/[0.1] text-white"
              />
              <Input
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white/[0.05] border-white/[0.1] text-white"
              />
              <Input
                placeholder="Hourly rate"
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                className="bg-white/[0.05] border-white/[0.1] text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddStaff} className="bg-green-600 text-xs h-8">
                Save Staff Member
              </Button>
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                className="border-white/[0.1] text-xs h-8"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Staff List */}
        <div className="space-y-2">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/[0.06] rounded-xl">
              <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-300 text-sm">No staff members found.</p>
            </div>
          ) : (
            filteredStaff.map(s => (
              <div key={s.id} className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.07] flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <div className="font-bold text-white">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={s.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}>
                      {s.status}
                    </Badge>
                    <span className="text-xs text-gray-500">{s.role}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-green-400 font-bold text-sm">${s.hourlyRate.toFixed(2)}/hr</div>
                    <div className="text-xs text-gray-500">{s.shiftsThisMonth} shifts</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(s.id)}
                      className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
                      title={s.status === "active" ? "Deactivate" : "Activate"}
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(s.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {filteredStaff.length > 0 && (
          <div className="mt-6 grid md:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.07]">
              <div className="text-gray-500 text-xs mb-1">Active Staff</div>
              <div className="text-cyan-400 font-black text-lg">{staff.filter(s => s.status === "active").length}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.07]">
              <div className="text-gray-500 text-xs mb-1">Total Staff</div>
              <div className="text-blue-400 font-black text-lg">{staff.length}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.07]">
              <div className="text-gray-500 text-xs mb-1">Avg Hourly Rate</div>
              <div className="text-green-400 font-black text-lg">
                ${(staff.reduce((sum, s) => sum + s.hourlyRate, 0) / staff.length).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </NUPSRouteGuard>
  );
}