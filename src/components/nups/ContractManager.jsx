import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { writeEntity } from "@/lib/nups/writeEntity";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Plus, CheckCircle, Printer, AlertCircle, Coins, FileText, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import {
  VIP_ROOM_SERVICE_AGREEMENT,
  GLYPHBUCKS_PURCHASE_AGREEMENT,
  ENTERTAINER_LICENSE_AGREEMENT,
} from "@/constants/contractText";

const CONTRACT_TYPES = ["VIP Package", "GlyphBucks Purchase", "Entertainer Agreement", "Service Agreement", "Custom"];
const PAYMENT_METHODS = ["Cash", "Credit Card", "Debit Card", "GlyphBucks", "Split"];

const STATUS_CONFIG = {
  draft:     { color: "text-gray-400",   bg: "bg-gray-500/10 border-gray-500/30" },
  active:    { color: "text-green-400",  bg: "bg-green-500/10 border-green-500/30" },
  fulfilled: { color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30" },
  voided:    { color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30" },
  disputed:  { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
};

// Resolve the full legal text for a contract based on type
function resolveContractText(contract, venue) {
  const v = venue || { name: "Venue", address: "", age_requirement: 21 };
  if (contract.contract_type === "GlyphBucks Purchase") {
    return GLYPHBUCKS_PURCHASE_AGREEMENT(v, {
      uuid: contract.contract_id || contract.id,
      timestamp: contract.created_date ? new Date(contract.created_date).toLocaleString() : new Date().toLocaleString(),
      customer_name: contract.customer_name || "",
      total: (contract.contract_amount || 0).toFixed(2),
      payment_method: contract.payment_method || "Card",
      approval_code: contract.approval_code || "PENDING",
      glyphbucks_serials: `${contract.glyphbucks_issued || 0} GB`,
    });
  }
  if (contract.contract_type === "Entertainer Agreement") {
    return ENTERTAINER_LICENSE_AGREEMENT(v);
  }
  // Default — VIP Package, Service Agreement, Custom
  return VIP_ROOM_SERVICE_AGREEMENT(v, {
    uuid: contract.contract_id || contract.id,
    timestamp: contract.created_date ? new Date(contract.created_date).toLocaleString() : new Date().toLocaleString(),
    guest_name: contract.customer_name || "Guest",
    room_number: contract.vip_session_id || "—",
    duration_minutes: 60,
    minimum_spend: (contract.contract_amount || 0).toFixed(2),
  });
}

export default function ContractManager({ user }) {
  const activeVenue = useActiveVenue();
  const venue_id = activeVenue?.id || activeVenue?.venue_id || null;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [signingContract, setSigningContract] = useState(null);
  const [signingScrolled, setSigningScrolled] = useState(false);
  const [signingAgreed, setSigningAgreed] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({
    contract_type: "VIP Package",
    customer_name: "",
    entertainer_name: "",
    contract_amount: "",
    glyphbucks_issued: "0",
    vip_session_id: "",
    payment_method: "Cash",
    notes: "",
  });

  const { data: venues = [] } = useQuery({
    queryKey: ["cm-venues"],
    queryFn: () => base44.entities.Venue.list(),
    initialData: [],
  });
  const currentVenue = venues?.[0] || activeVenue || { name: "Venue", address: "", age_requirement: 21 };

  const { data: contracts = [] } = useQuery({
    queryKey: ["venue-contracts", venue_id],
    queryFn: () => base44.entities.VenueContract.filter({ venue_id }, "-created_date", 200),
  });

  const { data: batches = [] } = useQuery({
    queryKey: ["pos-batches-open"],
    queryFn: () => base44.entities.POSBatch.filter({ status: "open" }),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const contractId = `CONTRACT-${Date.now()}`;
      const activeBatch = batches[0];
      const gbAmount = parseFloat(data.glyphbucks_issued) || 0;

      if (!venue_id) throw new Error("Select an active venue before creating a contract.");
      // Create the contract through the governed financial gateway.
      const contractWrite = await writeEntity({
        entity: "VenueContract",
        operation: "create",
        data: {
          ...data,
          contract_id: contractId,
          venue_id,
          contract_amount: parseFloat(data.contract_amount),
          glyphbucks_issued: gbAmount,
          batch_id: activeBatch?.id || activeBatch?.batch_id || "",
          manager_id: user?.email || "system",
          status: "active",
          is_printed: false,
          is_signed: false,
        },
        actor: { email: user?.email, id: user?.id, role: user?._highestRole || user?.role || "External" },
        venue_id,
        intent: "VENUE_CONTRACT_CREATE",
      });
      if (!contractWrite?.ok) throw new Error(contractWrite?.block_reason || "Contract write was rejected.");
      const contract = contractWrite.value;

      // If GlyphBucks issued, create a linked GlyphBucksTransaction
      if (gbAmount > 0) {
        const gbWrite = await writeEntity({
          entity: "GlyphBucksTransaction",
          operation: "create",
          data: {
            transaction_id: `GB-${Date.now()}`,
            venue_id,
            transaction_type: "Issue",
            amount: gbAmount,
            customer_name: data.customer_name,
            contract_id: contractId,
            vip_session_id: data.vip_session_id || "",
            batch_id: activeBatch?.id || activeBatch?.batch_id || "",
            cashier_id: user?.email || "system",
            notes: `Issued via Contract ${contractId}`,
            status: "active",
          },
          actor: { email: user?.email, id: user?.id, role: user?._highestRole || user?.role || "External" },
          venue_id,
          intent: "GLYPHBUCKS_ISSUE_FROM_CONTRACT",
        });
        if (!gbWrite?.ok) throw new Error(gbWrite?.block_reason || "GlyphBucks issue write was rejected.");
      }

      // Audit log
      await base44.entities.SystemAuditLog.create({
        event_type: "CONTRACT_CREATED",
        description: `Contract ${contractId} created for ${data.customer_name} — $${data.contract_amount} ${gbAmount > 0 ? `+ ${gbAmount} GB` : ""}`,
        actor_email: user?.email,
        resource_id: contractId,
        metadata: { type: data.contract_type, amount: data.contract_amount, glyphbucks: gbAmount },
        status: "success",
        severity: "low",
      });

      return contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["glyphbucks-transactions"] });
      setOpen(false);
      setForm({ contract_type: "VIP Package", customer_name: "", entertainer_name: "", contract_amount: "", glyphbucks_issued: "0", vip_session_id: "", payment_method: "Cash", notes: "" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      if (!venue_id) throw new Error("Active venue is required to update a contract.");
      const write = await writeEntity({
        entity: "VenueContract",
        operation: "update",
        id,
        data: { status },
        actor: { email: user?.email, id: user?.id, role: user?._highestRole || user?.role || "External" },
        venue_id,
        intent: `VENUE_CONTRACT_${String(status).toUpperCase()}`,
      });
      if (!write?.ok) throw new Error(write?.block_reason || "Contract status update was rejected.");
      return write.value;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["venue-contracts"] }),
  });

  const signMutation = useMutation({
    mutationFn: async (id) => {
      if (!venue_id) throw new Error("Active venue is required to sign a contract.");
      const signedAt = new Date().toISOString();
      const write = await writeEntity({
        entity: "VenueContract",
        operation: "update",
        id,
        data: {
          is_signed: true,
          signed_at: signedAt,
          signed_ip: window.location.hostname,
          customer_signature: `SIGNED-${user?.email || 'staff'}-${Date.now()}`,
        },
        actor: { email: user?.email, id: user?.id, role: user?._highestRole || user?.role || "External" },
        venue_id,
        intent: "VENUE_CONTRACT_SIGN",
      });
      if (!write?.ok) throw new Error(write?.block_reason || "Contract signature write was rejected.");
      const result = write.value;
              // AUDIT LOG — Phase 7 BPAAA: Contract signing must be logged
                    try {
                            await base44.entities.SystemAuditLog.create({
                                      event_type: 'CONTRACT_SIGNED',
                                                description: 'VenueContract ' + id + ' signed by ' + (user?.email || 'staff'),
                                                          actor_email: user?.email || 'unknown',
                                                                    entity_type: 'VenueContract',
                                                                              entity_id: id,
                                                                                        status: 'success',
                                                                                                  severity: 'medium',
                                                                                                            metadata: {
                                                                                                                        contract_id: id,
                                                                                                                                    signed_by: user?.email,
                                                                                                                                                signed_at: new Date().toISOString(),
                                                                                                                                                            section: 'PHASE7-CONTRACT-SIGNED'
                                                                                                                                                                      }
                                                                                                                                                                              });
                                                                                                                                                                                    } catch(auditErr) { console.warn('Contract sign audit log failed:', auditErr); }
                                                                                                                                                                                          return result;
                                                                                                                                                                                              },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["venue-contracts"] }),
  });

  const filtered = filterStatus === "all" ? contracts : contracts.filter(c => c.status === filterStatus);

  const totalContracts  = contracts.length;
  const totalValue      = contracts.filter(c => c.status !== "voided").reduce((s, c) => s + (c.contract_amount || 0), 0);
  const totalGBIssued   = contracts.filter(c => c.status !== "voided").reduce((s, c) => s + (c.glyphbucks_issued || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">Contract Manager</h2>
          <Badge className="bg-purple-500/10 border-purple-500/30 text-purple-400 text-xs">Legal System</Badge>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-500 text-white font-bold min-h-[44px]">
              <Plus className="w-4 h-4 mr-2" />New Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-purple-500/30 text-white max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-purple-400 flex items-center gap-2"><ScrollText className="w-4 h-4" />New Contract</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Contract Type</label>
                <Select value={form.contract_type} onValueChange={v => setForm(f => ({ ...f, contract_type: v }))}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {CONTRACT_TYPES.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Customer Name *</label>
                <Input placeholder="Customer" value={form.customer_name}
                  onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Entertainer (optional)</label>
                <Input placeholder="Entertainer name" value={form.entertainer_name}
                  onChange={e => setForm(f => ({ ...f, entertainer_name: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Contract Amount ($) *</label>
                <Input type="number" placeholder="0.00" value={form.contract_amount}
                  onChange={e => setForm(f => ({ ...f, contract_amount: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">GlyphBucks to Issue (optional)</label>
                <Input type="number" placeholder="0" value={form.glyphbucks_issued}
                  onChange={e => setForm(f => ({ ...f, glyphbucks_issued: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white" />
                <p className="text-xs text-yellow-500/70 mt-1">Will auto-create a GlyphBucks Issue transaction</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Payment Method</label>
                <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m} className="text-white">{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">VIP Session ID (optional)</label>
                <Input placeholder="VIP session ID" value={form.vip_session_id}
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
                disabled={!form.customer_name || !form.contract_amount || createMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold min-h-[44px]">
                {createMutation.isPending ? "Creating..." : "Create Contract"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400">Total Contracts</div>
            <div className="text-xl font-bold text-purple-400">{totalContracts}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400">Contract Value</div>
            <div className="text-xl font-bold text-green-400">${totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400">GB Issued via Contracts</div>
            <div className="text-xl font-bold text-yellow-400">{totalGBIssued.toFixed(2)} GB</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "draft", "active", "fulfilled", "voided", "disputed"].map(s => (
          <Button key={s} variant="outline" size="sm"
            onClick={() => setFilterStatus(s)}
            className={`min-h-[36px] text-xs capitalize ${filterStatus === s ? "bg-purple-500/20 border-purple-500/50 text-purple-400" : "border-gray-700 text-gray-400"}`}>
            {s}
          </Button>
        ))}
      </div>

      {/* Contract List */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No contracts found.</div>
        ) : filtered.map(contract => {
          const cfg = STATUS_CONFIG[contract.status] || STATUS_CONFIG.draft;
          return (
            <div key={contract.id} className={`p-3 rounded-lg border ${cfg.bg}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{contract.customer_name}</span>
                    <Badge variant="outline" className={`text-xs ${cfg.color} border-current`}>{contract.contract_type}</Badge>
                    <Badge variant="outline" className={`text-xs capitalize ${cfg.color} border-current`}>{contract.status}</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {contract.contract_id} · ${(contract.contract_amount || 0).toFixed(2)}
                    {contract.glyphbucks_issued > 0 && <span className="text-yellow-400 ml-2"><Coins className="w-3 h-3 inline" /> {contract.glyphbucks_issued} GB issued</span>}
                    {contract.entertainer_name && ` · ${contract.entertainer_name}`}
                  </div>
                  <div className="flex gap-2 mt-1">
                    {contract.is_signed && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Signed</span>}
                    {contract.is_printed && <span className="text-xs text-blue-400 flex items-center gap-1"><Printer className="w-3 h-3" />Printed</span>}
                    {!contract.is_signed && <span className="text-xs text-orange-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Unsigned</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-col items-end">
                  <Button variant="outline" size="sm"
                    onClick={() => { setSigningContract(contract); setSigningScrolled(false); setSigningAgreed(false); }}
                    className="text-xs border-purple-500/50 text-purple-400 min-h-[44px] min-w-[80px]">
                    <FileText className="w-3 h-3 mr-1" /> View
                  </Button>
                  {!contract.is_signed && (
                    <Button variant="outline" size="sm"
                      onClick={() => { setSigningContract(contract); setSigningScrolled(false); setSigningAgreed(false); }}
                      disabled={signMutation.isPending}
                      className="text-xs border-orange-500/50 text-orange-400 min-h-[44px] min-w-[80px]">Sign</Button>
                  )}
                  {contract.status === "active" && (
                    <Button variant="outline" size="sm"
                      onClick={() => updateStatusMutation.mutate({ id: contract.id, status: "fulfilled" })}
                      className="text-xs border-green-500/50 text-green-400 min-h-[44px] min-w-[80px]">Fulfill</Button>
                  )}
                  {contract.status === "active" && (
                    <Button variant="outline" size="sm"
                      onClick={() => updateStatusMutation.mutate({ id: contract.id, status: "voided" })}
                      className="text-xs border-red-500/50 text-red-400 min-h-[44px] min-w-[80px]">Void</Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FULL LEGAL CONTRACT VIEW + SIGN DIALOG ── */}
      <Dialog open={!!signingContract} onOpenChange={(o) => !o && setSigningContract(null)}>
        <DialogContent className="bg-gray-900 border-purple-500/30 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-purple-400 flex items-center gap-2">
              <ScrollText className="w-5 h-5" />
              {signingContract?.contract_type || "Contract"} — Full Legal Document
            </DialogTitle>
          </DialogHeader>

          {signingContract && (
            <div className="space-y-3 pt-2">
              <div className="text-xs text-gray-400">
                {signingContract.contract_id} · {signingContract.customer_name} ·
                <span className="text-green-400 ml-1">${(signingContract.contract_amount || 0).toFixed(2)}</span>
              </div>

              {!signingContract.is_signed && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white">
                    <span className="font-bold">Scroll to the bottom</span> to read and accept before signing.
                  </p>
                </div>
              )}

              <div
                onScroll={(e) => {
                  const el = e.target;
                  if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) setSigningScrolled(true);
                }}
                className="bg-black/60 border border-gray-700 rounded-lg p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-mono max-h-[50vh] overflow-y-auto"
              >
                {resolveContractText(signingContract, currentVenue)}
              </div>

              {!signingContract.is_signed && (
                <>
                  {!signingScrolled && (
                    <p className="text-center text-[11px] text-amber-400 animate-pulse">
                      ↓ Scroll to bottom to enable signing ↓
                    </p>
                  )}
                  {signingScrolled && (
                    <p className="text-center text-[11px] text-green-400">✓ Contract fully read</p>
                  )}
                  <div
                    className={`flex items-start gap-2 p-2.5 rounded-lg border transition-all ${
                      signingScrolled
                        ? "border-purple-500/30 bg-purple-500/5"
                        : "border-gray-700 bg-gray-800/30 opacity-50 pointer-events-none"
                    }`}
                  >
                    <Checkbox
                      checked={signingAgreed}
                      onCheckedChange={setSigningAgreed}
                      className="mt-0.5"
                      disabled={!signingScrolled}
                    />
                    <label
                      className={`text-[11px] leading-relaxed ${signingScrolled ? "text-white cursor-pointer" : "text-gray-500"}`}
                      onClick={() => signingScrolled && setSigningAgreed(!signingAgreed)}
                    >
                      I have read the entire agreement above and agree to all terms. This constitutes a legally binding signature.
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSigningContract(null)}
                      className="flex-1 border-gray-700 min-h-[44px]"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        signMutation.mutate(signingContract.id);
                        setSigningContract(null);
                      }}
                      disabled={!signingAgreed || !signingScrolled || signMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 font-bold min-h-[44px]"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Sign Contract
                    </Button>
                  </div>
                </>
              )}

              {signingContract.is_signed && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div className="text-sm text-green-400">Contract already signed {signingContract.signed_at ? `on ${new Date(signingContract.signed_at).toLocaleString()}` : ""}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}