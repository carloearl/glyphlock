import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Plus, TrendingUp, TrendingDown, RotateCcw, AlertCircle, ArrowRightLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const TX_TYPES = ["Issue", "Redeem", "Transfer", "Void", "Adjustment"];

const TYPE_CONFIG = {
  Issue:      { color: "text-green-400",  bg: "bg-green-500/10 border-green-500/30",  icon: TrendingUp },
  Redeem:     { color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30",    icon: TrendingDown },
  Transfer:   { color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30", icon: ArrowRightLeft },
  Void:       { color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30",      icon: AlertCircle },
  Adjustment: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", icon: RotateCcw },
};

export default function GlyphBucksLedger({ user, venue_id = "dream_palace" }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({
    transaction_type: "Issue",
    amount: "",
    customer_name: "",
    contract_id: "",
    vip_session_id: "",
    pos_transaction_id: "",
    notes: "",
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["glyphbucks-transactions", venue_id],
    queryFn: () => base44.entities.GlyphBucksTransaction.filter({ venue_id }, "-created_date", 200),
  });

  const { data: batches = [] } = useQuery({
    queryKey: ["pos-batches-open"],
    queryFn: () => base44.entities.POSBatch.filter({ status: "open" }),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const txId = `GB-${Date.now()}`;
      const activeBatch = batches[0];
      const record = {
        ...data,
        transaction_id: txId,
        venue_id,
        amount: parseFloat(data.amount),
        batch_id: activeBatch?.id || activeBatch?.batch_id || "",
        cashier_id: user?.email || "system",
        status: "active",
      };
      const created = await base44.entities.GlyphBucksTransaction.create(record);
      // Audit log
      await base44.entities.SystemAuditLog.create({
        event_type: `GLYPHBUCKS_${data.transaction_type.toUpperCase()}`,
        description: `GlyphBucks ${data.transaction_type}: ${data.amount} GB for ${data.customer_name}`,
        actor_email: user?.email,
        resource_id: txId,
        metadata: { amount: data.amount, type: data.transaction_type, contract_id: data.contract_id || null },
        status: "success",
        severity: "low",
      });
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glyphbucks-transactions"] });
      setOpen(false);
      setForm({ transaction_type: "Issue", amount: "", customer_name: "", contract_id: "", vip_session_id: "", pos_transaction_id: "", notes: "" });
    },
  });

  const filtered = filterType === "all" ? transactions : transactions.filter(t => t.transaction_type === filterType);

  const totalIssued   = transactions.filter(t => t.transaction_type === "Issue"  && t.status === "active").reduce((s, t) => s + (t.amount || 0), 0);
  const totalRedeemed = transactions.filter(t => t.transaction_type === "Redeem" && t.status === "active").reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const netLiability  = totalIssued - totalRedeemed;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-bold text-white">GlyphBucks Ledger</h2>
          <Badge className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400 text-xs">Liability System</Badge>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold min-h-[44px]">
              <Plus className="w-4 h-4 mr-2" />New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-yellow-500/30 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-yellow-400 flex items-center gap-2"><Coins className="w-4 h-4" />New GlyphBucks Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Transaction Type</label>
                <Select value={form.transaction_type} onValueChange={v => setForm(f => ({ ...f, transaction_type: v }))}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {TX_TYPES.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Amount (GB)</label>
                <Input type="number" placeholder="0.00" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Customer Name</label>
                <Input placeholder="Customer" value={form.customer_name}
                  onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Contract ID (optional)</label>
                <Input placeholder="CONTRACT-..." value={form.contract_id}
                  onChange={e => setForm(f => ({ ...f, contract_id: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">VIP Session ID (optional)</label>
                <Input placeholder="VIP-..." value={form.vip_session_id}
                  onChange={e => setForm(f => ({ ...f, vip_session_id: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notes</label>
                <Input placeholder="Optional notes" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white" />
              </div>
              <Button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.amount || !form.customer_name || createMutation.isPending}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold min-h-[44px]">
                {createMutation.isPending ? "Processing..." : "Record Transaction"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liability Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400">Total Issued</div>
            <div className="text-xl font-bold text-green-400">{totalIssued.toFixed(2)} GB</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400">Total Redeemed</div>
            <div className="text-xl font-bold text-blue-400">{totalRedeemed.toFixed(2)} GB</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400">Net Liability</div>
            <div className="text-xl font-bold text-yellow-400">{netLiability.toFixed(2)} GB</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...TX_TYPES].map(t => (
          <Button key={t} variant="outline" size="sm"
            onClick={() => setFilterType(t)}
            className={`min-h-[36px] text-xs ${filterType === t ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400" : "border-gray-700 text-gray-400"}`}>
            {t === "all" ? "All" : t}
          </Button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No GlyphBucks transactions recorded.</div>
        ) : filtered.map(tx => {
          const cfg = TYPE_CONFIG[tx.transaction_type] || TYPE_CONFIG.Adjustment;
          const Icon = cfg.icon;
          return (
            <div key={tx.id} className={`flex items-center justify-between p-3 rounded-lg border ${cfg.bg}`}>
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${cfg.color}`} />
                <div>
                  <div className="text-sm font-medium text-white">{tx.customer_name}</div>
                  <div className="text-xs text-gray-500">
                    {tx.transaction_id} {tx.contract_id && `· Contract: ${tx.contract_id}`} {tx.vip_session_id && `· VIP`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${cfg.color}`}>
                  {tx.transaction_type === "Redeem" ? "-" : "+"}{Math.abs(tx.amount).toFixed(2)} GB
                </div>
                <div className="text-xs text-gray-500">{new Date(tx.created_date).toLocaleString()}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}