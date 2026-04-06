import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Car, Plus, DollarSign, Star, Users, CheckCircle, ChevronDown, ChevronUp, Banknote, AlertCircle } from "lucide-react";

// --- Payout config (manager can adjust later)
const PER_DROP_RATE = 5;       // $5 per guest drop
const INCENTIVE_BONUS = 15;    // $15 bonus if 3+ drops
const VIP_KICKBACK = 10;       // $10 per guest who went VIP

function calcPayout(record) {
  const base = (record.total_drops || 0) * PER_DROP_RATE;
  const incentive = (record.total_drops || 0) >= 3 ? INCENTIVE_BONUS : 0;
  const vip = (record.vip_count || 0) * VIP_KICKBACK;
  return { base, incentive, vip, total: base + incentive + vip };
}

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

export default function DriverDropOffTracker({ user }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(null);
  const [showNewDriver, setShowNewDriver] = useState(false);
  const [newDriver, setNewDriver] = useState({ driver_name: "", driver_number: "" });
  const [dropForm, setDropForm] = useState({ guest_name: "", has_pass: false, went_vip: false, pass_type: "" });
  const [addingDropTo, setAddingDropTo] = useState(null);

  const today = todayDate();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["driver-payouts", today],
    queryFn: () => base44.entities.DriverPayout.filter({ session_date: today }),
    refetchInterval: 30000,
  });

  const createDriver = useMutation({
    mutationFn: (data) => base44.entities.DriverPayout.create({
      ...data,
      session_date: today,
      driver_code: `DRV-${data.driver_number}-${Date.now()}`,
      drop_offs: [],
      total_drops: 0,
      vip_count: 0,
      pass_count: 0,
      base_payout: 0,
      incentive_bonus: 0,
      vip_kickback: 0,
      total_payout: 0,
      status: "open",
    }),
    onSuccess: () => { qc.invalidateQueries(["driver-payouts"]); setShowNewDriver(false); setNewDriver({ driver_name: "", driver_number: "" }); },
  });

  const addDrop = useMutation({
    mutationFn: async ({ record, drop }) => {
      const drops = [...(record.drop_offs || []), { ...drop, drop_time: new Date().toISOString() }];
      const total_drops = drops.length;
      const vip_count = drops.filter(d => d.went_vip).length;
      const pass_count = drops.filter(d => d.has_pass).length;
      const { base, incentive, vip, total } = calcPayout({ total_drops, vip_count });
      return base44.entities.DriverPayout.update(record.id, {
        drop_offs: drops,
        total_drops,
        vip_count,
        pass_count,
        base_payout: base,
        incentive_bonus: incentive,
        vip_kickback: vip,
        total_payout: total,
      });
    },
    onSuccess: () => { qc.invalidateQueries(["driver-payouts"]); setAddingDropTo(null); setDropForm({ guest_name: "", has_pass: false, went_vip: false, pass_type: "" }); },
  });

  const markPaid = useMutation({
    mutationFn: async (record) => {
      const { total } = calcPayout(record);
      // Record cash outflow from till so Z-report accounts for it
      await base44.entities.POSTransaction.create({
        transaction_id: `DRIVER-PAYOUT-${record.id}-${Date.now()}`,
        items: [{
          product_id: 'driver_kickback',
          product_name: `Driver Kickback — ${record.driver_name}`,
          quantity: 1,
          price: -total,
          total: -total,
        }],
        subtotal: -total,
        tax: 0,
        total: -total,
        payment_method: 'Cash',
        cashier: user?.email || 'manager',
        status: 'completed',
        notes: `Driver kickback payout: ${record.driver_name} | ${record.total_drops} drops | ${record.vip_count} VIP kickbacks | Paid from door till`,
      });
      return base44.entities.DriverPayout.update(record.id, {
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_by: user?.email || 'manager',
      });
    },
    onSuccess: () => qc.invalidateQueries(['driver-payouts']),
  });

  const openRecords = records.filter(r => r.status === "open");
  const paidRecords = records.filter(r => r.status === "paid");
  const tillOwes = openRecords.reduce((s, r) => s + calcPayout(r).total, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-bold text-white">Driver Drop-Off Tracker</h2>
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 text-xs">{today}</Badge>
        </div>
        <Button
          onClick={() => setShowNewDriver(v => !v)}
          className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold text-sm min-h-[40px]"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Driver
        </Button>
      </div>

      {/* New Driver Form */}
      {showNewDriver && (
        <Card className="bg-yellow-950/30 border-yellow-500/40">
          <CardContent className="p-4 space-y-3">
            <p className="text-yellow-300 font-semibold text-sm">Register New Driver</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Driver Name"
                value={newDriver.driver_name}
                onChange={e => setNewDriver(v => ({ ...v, driver_name: e.target.value }))}
                className="bg-black/40 border-gray-700 text-white"
              />
              <Input
                placeholder="Phone / Badge #"
                value={newDriver.driver_number}
                onChange={e => setNewDriver(v => ({ ...v, driver_number: e.target.value }))}
                className="bg-black/40 border-gray-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => createDriver.mutate(newDriver)}
                disabled={!newDriver.driver_name || !newDriver.driver_number}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
              >Register</Button>
              <Button variant="outline" onClick={() => setShowNewDriver(false)} className="border-gray-700 text-gray-300">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}

      {/* Till Owes Drivers — prominent alert for door staff */}
      {openRecords.length > 0 && (
        <div className="flex items-center justify-between bg-yellow-950/40 border border-yellow-500/50 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-yellow-300 font-bold text-sm">Till Owes Drivers Tonight</p>
              <p className="text-yellow-500 text-xs">Reserve this cash in the door till — paid out when drivers collect</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-yellow-400">${tillOwes.toFixed(2)}</div>
        </div>
      )}

      {/* Night Summary Bar */}
      {records.length > 0 && (

      {/* Open Driver Cards */}
      {openRecords.length === 0 && !isLoading && (
        <p className="text-gray-600 text-sm text-center py-8">No drivers registered tonight. Add one above.</p>
      )}

      {openRecords.map(record => {
        const isOpen = expanded === record.id;
        const isAddingDrop = addingDropTo === record.id;
        const { base, incentive, vip, total } = calcPayout(record);
        const qualifiesIncentive = (record.total_drops || 0) >= 3;

        return (
          <Card key={record.id} className="bg-gray-900/60 border-gray-700/50">
            <CardContent className="p-4 space-y-3">
              {/* Driver Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold text-white">{record.driver_name}</span>
                    <span className="text-gray-500 text-xs">#{record.driver_number}</span>
                    {qualifiesIncentive && (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/40 text-xs">
                        <Star className="w-3 h-3 mr-1" />Incentive
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span><Users className="w-3 h-3 inline mr-1" />{record.total_drops || 0} drops</span>
                    <span className="text-purple-400">{record.vip_count || 0} VIP</span>
                    <span className="text-blue-400">{record.pass_count || 0} passes</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-lg">${total.toFixed(2)}</div>
                    <div className="text-[10px] text-gray-500">payout</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(isOpen ? null : record.id)}
                    className="text-gray-400"
                  >
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Payout Breakdown */}
              {isOpen && (
                <div className="border-t border-gray-800 pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-gray-800/60 rounded p-2 text-center">
                      <div className="text-white font-bold">${base.toFixed(2)}</div>
                      <div className="text-gray-500">{record.total_drops} × ${PER_DROP_RATE} base</div>
                    </div>
                    <div className={`rounded p-2 text-center ${qualifiesIncentive ? 'bg-green-900/30' : 'bg-gray-800/30'}`}>
                      <div className={`font-bold ${qualifiesIncentive ? 'text-green-400' : 'text-gray-600'}`}>${incentive.toFixed(2)}</div>
                      <div className="text-gray-500">incentive bonus</div>
                    </div>
                    <div className="bg-purple-900/20 rounded p-2 text-center">
                      <div className="text-purple-400 font-bold">${vip.toFixed(2)}</div>
                      <div className="text-gray-500">{record.vip_count} VIP kickback</div>
                    </div>
                  </div>

                  {/* Drop log */}
                  {(record.drop_offs || []).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Drop Log</p>
                      {record.drop_offs.map((d, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-800/40 rounded px-3 py-1.5 text-xs">
                          <span className="text-gray-300">{d.guest_name || `Guest ${i + 1}`}</span>
                          <div className="flex gap-2">
                            {d.has_pass && <Badge className="bg-blue-500/20 text-blue-300 text-[10px] border-blue-500/30">Pass</Badge>}
                            {d.went_vip && <Badge className="bg-purple-500/20 text-purple-300 text-[10px] border-purple-500/30">VIP</Badge>}
                            <span className="text-gray-600">{new Date(d.drop_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Drop Form */}
                  {isAddingDrop ? (
                    <div className="bg-black/30 rounded p-3 space-y-2">
                      <Input
                        placeholder="Guest name (optional)"
                        value={dropForm.guest_name}
                        onChange={e => setDropForm(v => ({ ...v, guest_name: e.target.value }))}
                        className="bg-black/40 border-gray-700 text-white text-sm"
                      />
                      <div className="flex gap-3 text-sm">
                        <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                          <input type="checkbox" checked={dropForm.has_pass} onChange={e => setDropForm(v => ({ ...v, has_pass: e.target.checked }))} />
                          Has Pass
                        </label>
                        <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                          <input type="checkbox" checked={dropForm.went_vip} onChange={e => setDropForm(v => ({ ...v, went_vip: e.target.checked }))} />
                          Went VIP
                        </label>
                      </div>
                      {dropForm.has_pass && (
                        <Input
                          placeholder="Pass type (e.g. VIP, Comp)"
                          value={dropForm.pass_type}
                          onChange={e => setDropForm(v => ({ ...v, pass_type: e.target.value }))}
                          className="bg-black/40 border-gray-700 text-white text-sm"
                        />
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => addDrop.mutate({ record, drop: dropForm })}
                          className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold text-sm"
                        >Log Drop</Button>
                        <Button variant="outline" onClick={() => setAddingDropTo(null)} className="border-gray-700 text-gray-300 text-sm">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setAddingDropTo(record.id)}
                      variant="outline"
                      className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 text-sm w-full"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Log Guest Drop-Off
                    </Button>
                  )}

                  {/* Mark Paid — cash comes from door till, logged as till outflow */}
                  <div className="bg-gray-800/40 rounded p-2 flex items-start gap-2 text-xs text-gray-400">
                    <AlertCircle className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />
                    <span>Kickback paid from <strong className="text-yellow-300">door till cash</strong>. This will be logged as a cash outflow on the Z-report.</span>
                  </div>
                  <Button
                    onClick={() => markPaid.mutate(record)}
                    className="w-full bg-green-700 hover:bg-green-600 text-white font-bold"
                    disabled={markPaid.isPending}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay ${total.toFixed(2)} to {record.driver_name} (from till)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Paid Records */}
      {paidRecords.length > 0 && (
        <div className="border-t border-gray-800 pt-4 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Paid Out Tonight</p>
          {paidRecords.map(record => (
            <div key={record.id} className="flex items-center justify-between bg-gray-900/30 rounded px-3 py-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-300 text-sm">{record.driver_name} <span className="text-gray-600">#{record.driver_number}</span></span>
                <span className="text-gray-500 text-xs">{record.total_drops} drops</span>
              </div>
              <span className="text-green-400 font-bold">${(record.total_payout || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}