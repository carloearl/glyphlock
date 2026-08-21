/**
 * VIPContractLifecycle — Step 6
 * Lifecycle: Draft → Issued → Signed → Archived
 * Connects: Entertainer identity, VIP event/show, manager approval, payout logic
 */
import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { writeEntity } from "@/lib/nups/writeEntity";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  FileText, Plus, CheckCircle2, Archive, Send, Pen, ScrollText,
  DollarSign, User, Clock, AlertTriangle, ChevronDown, ChevronUp
} from "lucide-react";
import { VIP_ROOM_SERVICE_AGREEMENT } from "@/constants/contractText";

const STATUS_CONFIG = {
  draft:    { label: "Draft",    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",   next: "issued" },
  issued:   { label: "Issued",   color: "bg-blue-500/10 text-blue-400 border-blue-500/20",         next: "signed" },
  signed:   { label: "Signed",   color: "bg-green-500/10 text-green-400 border-green-500/20",      next: "archived" },
  archived: { label: "Archived", color: "bg-gray-500/10 text-gray-400 border-gray-500/20",         next: null },
};

const TRANSITION_LABELS = {
  issued:   { label: "Issue to Entertainer", icon: Send,        color: "bg-blue-600 hover:bg-blue-500" },
  signed:   { label: "Mark as Signed",       icon: Pen,         color: "bg-green-600 hover:bg-green-500" },
  archived: { label: "Archive",              icon: Archive,     color: "bg-gray-700 hover:bg-gray-600" },
};

function ContractCard({ contract, entertainers, venue, onTransition, currentUser }) {
  const [expanded, setExpanded] = useState(false);
  const [sigName, setSigName] = useState("");
  const [hasScrolledContract, setHasScrolledContract] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const contractScrollRef = useRef(null);
  const cfg = STATUS_CONFIG[contract.status] || STATUS_CONFIG.draft;
  const nextStatus = cfg.next;
  const transitionCfg = nextStatus ? TRANSITION_LABELS[nextStatus] : null;
  const entertainer = entertainers.find(e => e.id === contract.contractor_id);
  const payout = (contract.total_payout || 0);

  const handleContractScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 40) {
      setHasScrolledContract(true);
    }
  };

  // Build booking payload for the legal agreement template
  const bookingPayload = {
    uuid: contract.id || "—",
    timestamp: contract.created_date
      ? new Date(contract.created_date).toLocaleString()
      : new Date().toLocaleString(),
    guest_name: contract.contractor_name || entertainer?.stage_name || "Entertainer",
    room_number: contract.payout_type || "—",
    duration_minutes: contract.duration_minutes || 60,
    minimum_spend: (contract.total_payout || 0).toFixed(2),
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        style={{ background: "rgba(255,255,255,0.02)" }}
        onClick={() => setExpanded(!expanded)}
      >
        <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm truncate">
            {entertainer?.stage_name || contract.contractor_name || "Unknown Entertainer"}
          </div>
          <div className="text-[11px] text-gray-500 truncate">{contract.payout_type} · {new Date(contract.payout_date).toLocaleDateString()}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono text-green-400 font-bold text-sm">${payout.toFixed(2)}</span>
          <Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 py-3 border-t space-y-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Entertainer</div>
              <div className="text-white font-medium">{entertainer?.stage_name || contract.contractor_name}</div>
              <div className="text-xs text-gray-500">{entertainer?.legal_name}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Event / Show</div>
              <div className="text-white">{contract.payout_type}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Payout</div>
              <div className="text-green-400 font-black font-mono">${payout.toFixed(2)}</div>
              <div className="text-[10px] text-gray-600">Rate: {((contract.redemption_rate || 0.85) * 100).toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Payment</div>
              <div className="text-white">{contract.payment_method || "Cash"}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Approved By</div>
              <div className="text-white">{contract.approved_by || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Status</div>
              <Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
            </div>
          </div>

          {contract.notes && (
            <div className="text-xs text-gray-400 bg-white/[0.02] rounded-lg p-2">{contract.notes}</div>
          )}

          {/* Signature collection for "signed" transition — FULL LEGAL CONTRACT */}
          {nextStatus === "signed" && (
            <div className="space-y-3 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-blue-300">
                <ScrollText className="w-3.5 h-3.5" />
                VIP Room Service Agreement — Read & Sign
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white">
                  <span className="font-bold">You must scroll to the bottom</span> to read and accept this agreement.
                </p>
              </div>

              <div
                ref={contractScrollRef}
                onScroll={handleContractScroll}
                className="h-64 overflow-y-auto bg-gray-900/70 border border-gray-600 rounded-lg p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-mono"
              >
                {VIP_ROOM_SERVICE_AGREEMENT(venue, bookingPayload)}
              </div>

              {!hasScrolledContract ? (
                <p className="text-center text-[11px] text-amber-400/70 animate-pulse">
                  ↓ Scroll to the bottom of the contract to unlock the signature field
                </p>
              ) : (
                <p className="text-center text-[11px] text-green-400">
                  ✓ Contract fully read — you may now sign below
                </p>
              )}

              <div
                className={`flex items-start gap-2 p-2.5 rounded-lg border transition-all ${
                  hasScrolledContract
                    ? "border-blue-500/30 bg-blue-500/5"
                    : "border-gray-700 bg-gray-800/30 opacity-50 pointer-events-none"
                }`}
              >
                <Checkbox
                  checked={agreed}
                  onCheckedChange={setAgreed}
                  className="mt-0.5"
                  disabled={!hasScrolledContract}
                />
                <label
                  className={`text-[11px] leading-relaxed ${
                    hasScrolledContract ? "text-white cursor-pointer" : "text-gray-500"
                  }`}
                  onClick={() => hasScrolledContract && setAgreed(!agreed)}
                >
                  I have read the entire VIP Room Service Agreement above and agree to all terms.
                  I understand this is a legally binding contract.
                </label>
              </div>

              <div>
                <Label className="text-gray-500 text-xs">Entertainer Signature (type to sign)</Label>
                <Input
                  value={sigName}
                  onChange={(e) => setSigName(e.target.value)}
                  placeholder="Type full legal name to sign"
                  className="mt-1 text-white bg-white/[0.04] border-white/[0.1]"
                  style={{ fontFamily: "cursive", fontSize: "1.05rem" }}
                  disabled={!hasScrolledContract || !agreed}
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  By typing your name, you agree this constitutes a legal digital signature.
                </p>
              </div>
            </div>
          )}

          {/* Transition button */}
          {transitionCfg && (
            <Button
              size="sm"
              disabled={nextStatus === "signed" && (!sigName.trim() || !agreed || !hasScrolledContract)}
              onClick={() => onTransition(contract, nextStatus, sigName)}
              className={`text-xs ${transitionCfg.color}`}
            >
              <transitionCfg.icon className="w-3.5 h-3.5 mr-1.5" />
              {transitionCfg.label}
            </Button>
          )}

          {contract.status === "archived" && (
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <Archive className="w-3 h-3" /> Archived — read-only record
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VIPContractLifecycle({ currentUser }) {
  const qc = useQueryClient();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const [showNew, setShowNew] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [newContract, setNewContract] = useState({
    contractor_id: "", payout_type: "vip_commission", total_payout: "",
    payment_method: "cash", notes: "", redemption_rate: 0.85
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ["vip-contract-payouts"],
    queryFn: () => base44.entities.ContractorPayout.list("-created_date", 200),
  });

  const { data: entertainers = [] } = useQuery({
    queryKey: ["vip-contract-entertainers"],
    queryFn: () => base44.entities.Entertainer.list(),
  });

  const { data: venues = [] } = useQuery({
    queryKey: ["vip-contract-venues"],
    queryFn: () => base44.entities.Venue.list(),
    initialData: [],
  });
  const currentVenue = venues?.[0] || { name: "Venue", address: "", age_requirement: 21 };

  const createContract = useMutation({
    mutationFn: async () => {
      if (!venueId) throw new Error("Select an active venue before creating a contractor payout agreement.");
      const result = await writeEntity({
        entity: "ContractorPayout",
        operation: "create",
        data: {
          contractor_id: newContract.contractor_id,
          contractor_name: entertainers.find(e => e.id === newContract.contractor_id)?.stage_name || "",
          payout_date: new Date().toISOString().split("T")[0],
          payout_type: newContract.payout_type,
          total_payout: parseFloat(newContract.total_payout) || 0,
          payment_method: newContract.payment_method,
          notes: newContract.notes,
          redemption_rate: newContract.redemption_rate,
          approved_by: currentUser?.email,
          status: "draft",
          venue_id: venueId,
        },
        actor: { email: currentUser?.email, id: currentUser?.id, role: currentUser?._highestRole || currentUser?.role || "External" },
        venue_id: venueId,
        intent: "CONTRACTOR_PAYOUT_AGREEMENT_CREATE",
      });
      if (!result?.ok) throw new Error(result?.block_reason || "Contractor payout agreement was rejected.");
      return result.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vip-contract-payouts"] });
      setShowNew(false);
      setNewContract({ contractor_id: "", payout_type: "vip_commission", total_payout: "", payment_method: "cash", notes: "", redemption_rate: 0.85 });
      toast.success("Contract created as Draft");
    },
  });

  const transition = useMutation({
    mutationFn: async ({ contract, newStatus, sigName }) => {
      const effectiveVenueId = contract.venue_id || venueId;
      if (!effectiveVenueId) throw new Error("Active venue is required to update this contractor payout agreement.");
      const updates = { status: newStatus };
      if (newStatus === "signed") {
        updates.contractor_signature = sigName;
        updates.signature_timestamp = new Date().toISOString();
        updates.approved_by = currentUser?.email;
      }
      if (newStatus === "paid") {
        updates.paid_by = currentUser?.email;
      }
      const result = await writeEntity({
        entity: "ContractorPayout",
        operation: "update",
        id: contract.id,
        data: updates,
        actor: { email: currentUser?.email, id: currentUser?.id, role: currentUser?._highestRole || currentUser?.role || "External" },
        venue_id: effectiveVenueId,
        intent: `CONTRACTOR_PAYOUT_AGREEMENT_${String(newStatus).toUpperCase()}`,
      });
      if (!result?.ok) throw new Error(result?.block_reason || "Contractor payout agreement update was rejected.");
      return result.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vip-contract-payouts"] });
      toast.success("Contract updated");
    },
    onError: () => toast.error("Failed to update contract"),
  });

  const filtered = filterStatus === "all"
    ? payouts
    : payouts.filter(p => p.status === filterStatus);

  // Summary counts
  const counts = Object.fromEntries(
    Object.keys(STATUS_CONFIG).map(k => [k, payouts.filter(p => p.status === k).length])
  );

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" /> VIP Contract Lifecycle
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">Draft → Issued → Signed → Archived</p>
        </div>
        <Button size="sm" onClick={() => setShowNew(!showNew)} className="bg-blue-600 hover:bg-blue-500 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> New Contract
        </Button>
      </div>

      {/* Status counters */}
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
          <button
            key={k}
            onClick={() => setFilterStatus(filterStatus === k ? "all" : k)}
            className={`rounded-lg p-2 text-center transition-all border ${
              filterStatus === k ? cfg.color : "border-white/[0.06] text-gray-600"
            }`}
          >
            <div className="text-xl font-black">{counts[k] || 0}</div>
            <div className="text-[10px] uppercase tracking-widest">{cfg.label}</div>
          </button>
        ))}
      </div>

      {/* New Contract Form */}
      {showNew && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-white">Create Contract — Draft</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-400 text-xs">Entertainer</Label>
                <Select value={newContract.contractor_id} onValueChange={v => setNewContract(p => ({ ...p, contractor_id: v }))}>
                  <SelectTrigger className="mt-1 text-white bg-white/[0.04] border-white/[0.12]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {entertainers.map(e => <SelectItem key={e.id} value={e.id}>{e.stage_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Event / Type</Label>
                <Select value={newContract.payout_type} onValueChange={v => setNewContract(p => ({ ...p, payout_type: v }))}>
                  <SelectTrigger className="mt-1 text-white bg-white/[0.04] border-white/[0.12]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="vip_commission">VIP Commission</SelectItem>
                    <SelectItem value="shift_earnings">Shift Earnings</SelectItem>
                    <SelectItem value="dream_dollar_redemption">Dream Dollar Redemption</SelectItem>
                    <SelectItem value="tip_share">Tip Share</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Payout Amount ($)</Label>
                <Input type="number" value={newContract.total_payout} onChange={e => setNewContract(p => ({ ...p, total_payout: e.target.value }))}
                  placeholder="0.00" className="mt-1 text-white bg-white/[0.04] border-white/[0.12]" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Payment Method</Label>
                <Select value={newContract.payment_method} onValueChange={v => setNewContract(p => ({ ...p, payment_method: v }))}>
                  <SelectTrigger className="mt-1 text-white bg-white/[0.04] border-white/[0.12]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                    <SelectItem value="paycard">Pay Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Notes</Label>
              <Input value={newContract.notes} onChange={e => setNewContract(p => ({ ...p, notes: e.target.value }))}
                placeholder="Optional notes" className="mt-1 text-white bg-white/[0.04] border-white/[0.12]" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createContract.mutate()} disabled={!newContract.contractor_id || !newContract.total_payout || createContract.isPending}
                className="bg-blue-600 hover:bg-blue-500 text-sm">
                {createContract.isPending ? "Creating…" : "Create as Draft"}
              </Button>
              <Button variant="outline" onClick={() => setShowNew(false)} className="border-white/10 text-gray-400 text-sm">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-600 text-sm">
          {filterStatus === "all" ? "No contracts yet. Create one above." : `No ${filterStatus} contracts.`}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <ContractCard
              key={c.id}
              contract={c}
              entertainers={entertainers}
              venue={currentVenue}
              currentUser={currentUser}
              onTransition={(contract, newStatus, sigName) =>
                transition.mutate({ contract, newStatus, sigName })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}