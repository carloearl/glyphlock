import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RotateCcw, Search, Printer, CheckCircle2, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { useNUPSOperatingMode } from "@/hooks/useNUPSOperatingMode";
import { scopeRowsToOperatingMode } from "@/lib/nups/operatingMode";
import { writeEntity } from "@/lib/nups/writeEntity";
import { printHtml } from "@/lib/nups/printHtml";

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const cardMethods = new Set(["Credit Card", "Debit Card", "Digital Wallet", "Gift Card"]);

export default function RefundManager({ user }) {
  const queryClient = useQueryClient();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const modeState = useNUPSOperatingMode(venueId);
  const [searchId, setSearchId] = useState("");
  const [found, setFound] = useState(null);
  const [reason, setReason] = useState("");
  const [refundReference, setRefundReference] = useState("");
  const [refundDone, setRefundDone] = useState(false);
  const [searching, setSearching] = useState(false);
  const [printing, setPrinting] = useState(false);

  const searchTransaction = async () => {
    const needle = searchId.trim();
    if (!needle) {
      toast.info("Enter a transaction id.");
      return;
    }
    setSearching(true);
    try {
      const rows = await base44.entities.POSTransaction.list("-created_date", 2000);
      const scoped = scopeRowsToOperatingMode(rows, {
        ledgerMode: modeState.ledgerMode,
        operatingMode: modeState.operatingMode,
        venueId,
        kind: "transactional",
      });
      const match = scoped.find((transaction) =>
        String(transaction.transaction_id || "").toLowerCase() === needle.toLowerCase()
        || String(transaction.id || "").toLowerCase() === needle.toLowerCase()
      );
      setFound(match || "NOT_FOUND");
      setRefundDone(false);
      setReason("");
      setRefundReference("");
    } catch (error) {
      toast.error(`Transaction lookup failed: ${error?.message || "unknown error"}`);
    } finally {
      setSearching(false);
    }
  };

  const requiresExternalReference = Boolean(found && found !== "NOT_FOUND" && modeState.isLive && cardMethods.has(found.payment_method));

  const processRefund = useMutation({
    mutationFn: async () => {
      if (!found || found === "NOT_FOUND") throw new Error("Choose a transaction first.");
      if (found.status === "refunded") throw new Error("This transaction is already refunded.");
      if (reason.trim().length < 5) throw new Error("Enter a clear refund reason (at least 5 characters).");
      if (requiresExternalReference && refundReference.trim().length < 3) {
        throw new Error("Record the refund confirmation returned by the payment terminal or processor.");
      }

      let liveActor = null;
      try { liveActor = await base44.auth.me(); } catch (_) { /* shell user may be primary */ }
      const actorEmail = liveActor?.email || user?.email || "unknown";
      const actorRole = user?._highestRole || user?.role || liveActor?._highestRole || liveActor?.role || "VENUE_MANAGER";
      const refundedAt = new Date().toISOString();
      const reference = refundReference.trim()
        || (modeState.isLive ? `CASH-RETURN-${Date.now()}` : `TRAINING-REFUND-${Date.now()}`);

      const result = await writeEntity({
        entity: "POSTransaction",
        operation: "update",
        recordId: found.id,
        data: {
          ...found,
          status: "refunded",
          refund_reference: reference,
          refund_reason: reason.trim(),
          refunded_at: refundedAt,
          refunded_by: actorEmail,
          notes: `${found.notes || ""}${found.notes ? " · " : ""}REFUND ${reference} by ${actorEmail}: ${reason.trim()}`,
        },
        actor: {
          email: actorEmail,
          id: liveActor?.id || user?.id,
          role: actorRole,
        },
        venue_id: venueId,
        intent: `${modeState.operatingMode}_REFUND`,
        requestContext: {
          mode: modeState.ledgerMode,
          validation_run: modeState.isNonLive,
          session_id: modeState.trainingSession?.id || null,
        },
      });
      if (!result?.ok) throw new Error(result?.block_reason || "Refund update was rejected.");

      await base44.entities.SystemAuditLog.create({
        event_type: "REFUND_PROCESSED",
        description: `${modeState.operatingMode} refund recorded for ${found.transaction_id} — $${Number(found.total || 0).toFixed(2)}`,
        actor_email: actorEmail,
        venue_id: venueId,
        status: "success",
        severity: "high",
        metadata: {
          transaction_id: found.transaction_id,
          refund_amount: found.total,
          payment_method: found.payment_method,
          refund_reference: reference,
          reason: reason.trim(),
          mode: modeState.ledgerMode,
          operating_mode: modeState.operatingMode,
          external_processor_action_confirmed: requiresExternalReference,
        },
      });

      return result.value || { ...found, status: "refunded", refund_reference: reference, refund_reason: reason.trim(), refunded_at: refundedAt, refunded_by: actorEmail };
    },
    onSuccess: (updated) => {
      setFound(updated);
      queryClient.invalidateQueries({ queryKey: ["pos-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["receipts-page-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["batch-transactions"] });
      setRefundDone(true);
      toast.success(`${modeState.operatingMode} refund recorded`);
    },
    onError: (error) => toast.error(error?.message || "Refund failed"),
  });

  const printRefundSlip = async () => {
    if (!found || found === "NOT_FOUND" || printing) return;
    setPrinting(true);
    const reference = found.refund_reference || refundReference || "N/A";
    const html = `<!doctype html><html><head><title>Refund ${escapeHtml(found.transaction_id)}</title><style>
      *{box-sizing:border-box}body{font-family:'Courier New',monospace;padding:18px;font-size:12px;width:302px;color:#000}
      h1{text-align:center;font-size:17px;margin:0 0 4px}.center{text-align:center}.row{display:flex;justify-content:space-between;gap:12px;margin:4px 0}.rule{border-top:1px dashed #000;margin:9px 0}
      .mode{border:2px solid #000;padding:5px;text-align:center;font-weight:900;margin-bottom:8px}
      @media print{@page{margin:0;size:80mm auto}body{width:80mm}}
    </style></head><body>
      ${modeState.isNonLive ? `<div class="mode">${escapeHtml(modeState.operatingMode)} · SAMPLE · FUNDS OFF</div>` : ""}
      <h1>REFUND RECORD</h1><div class="center">${escapeHtml(activeVenue?.name || activeVenue?.venue_name || "NUPS Venue")}</div>
      <div class="rule"></div>
      <div class="row"><span>Original TXN</span><b>${escapeHtml(found.transaction_id)}</b></div>
      <div class="row"><span>Amount</span><b>$${Number(found.total || 0).toFixed(2)}</b></div>
      <div class="row"><span>Method</span><span>${escapeHtml(found.payment_method)}</span></div>
      <div class="row"><span>Reference</span><span>${escapeHtml(reference)}</span></div>
      <div class="row"><span>Authorized</span><span>${escapeHtml(found.refunded_by || user?.email || "N/A")}</span></div>
      <div class="row"><span>Date</span><span>${escapeHtml(new Date(found.refunded_at || Date.now()).toLocaleString())}</span></div>
      <div class="rule"></div><b>Reason</b><div>${escapeHtml(found.refund_reason || reason)}</div>
      <div class="rule"></div><div class="center" style="font-size:9px">N.U.P.S. · refund record · original tender processor reference retained</div>
    </body></html>`;
    try {
      await printHtml(html, { title: `Refund - ${found.transaction_id}` });
      toast.success("Refund print dialog opened");
    } catch (error) {
      toast.error(`Refund print failed: ${error?.message || "unknown error"}`);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Card className="bg-white/[0.02] border-white/[0.06]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-red-400 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Refund Manager</span>
          <Badge variant="outline" className={modeState.isLive ? "border-emerald-500/40 text-emerald-300" : "border-amber-500/40 text-amber-300"}>
            {modeState.operatingMode}{modeState.isNonLive ? " · FUNDS OFF" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={searchId}
            onChange={(event) => setSearchId(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && searchTransaction()}
            placeholder="Transaction ID (TXN-...)"
            className="bg-black/40 border-white/10 text-white font-mono min-h-[44px]"
          />
          <Button type="button" onClick={searchTransaction} disabled={searching} className="min-h-[44px] bg-red-600 hover:bg-red-700">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {modeState.isLive && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[.05] p-3 text-[11px] text-emerald-100/80">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            NUPS records the refund and audit evidence. Card/digital refunds must first be completed on the payment terminal or processor; enter its confirmation reference below.
          </div>
        )}

        {found === "NOT_FOUND" && (
          <div className="text-center py-4 text-red-400 text-sm">
            <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
            Transaction not found in this venue and operating mode.
          </div>
        )}

        {found && found !== "NOT_FOUND" && (
          <div className="space-y-3">
            <div className="bg-black/40 border border-white/10 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between gap-3"><span className="text-gray-400">TXN:</span><span className="text-white font-mono truncate">{found.transaction_id}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Amount:</span><span className="text-green-400 font-bold">${Number(found.total || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Method:</span><span className="text-white">{found.payment_method}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Status:</span>
                <Badge className={found.status === "refunded" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}>{found.status}</Badge>
              </div>
              {found.refund_reference && <div className="flex justify-between gap-3"><span className="text-gray-400">Refund ref:</span><span className="font-mono text-cyan-300 truncate">{found.refund_reference}</span></div>}
            </div>

            {found.status === "refunded" || refundDone ? (
              <div className="text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
                <p className="text-green-400 font-bold">Refund Recorded</p>
                <Button type="button" onClick={printRefundSlip} disabled={printing} variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400">
                  {printing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Printer className="w-3 h-3 mr-1" />} Print Refund Record
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-xs text-gray-400">Reason for Refund *</Label>
                  <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="What happened and why is the refund authorized?" className="bg-black/40 border-white/10 text-white" />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">
                    {requiresExternalReference ? "Processor / terminal refund reference *" : "Refund reference (optional for cash)"}
                  </Label>
                  <Input
                    value={refundReference}
                    onChange={(event) => setRefundReference(event.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, "").slice(0, 64))}
                    placeholder={requiresExternalReference ? "REFUND-APPROVAL-CODE" : "Cash return / manager reference"}
                    className="bg-black/40 border-white/10 text-white font-mono"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => processRefund.mutate()}
                  disabled={reason.trim().length < 5 || (requiresExternalReference && refundReference.trim().length < 3) || processRefund.isPending}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-600 font-bold min-h-[48px]"
                >
                  {processRefund.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  Record Refund — ${Number(found.total || 0).toFixed(2)}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
