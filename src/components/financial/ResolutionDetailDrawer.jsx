import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle, XCircle, RefreshCw, Play, FileText, History, Bell, Lock, AlertTriangle, Undo2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_COLORS = {
  PENDING_CORPORATE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  PENDING_COMPLIANCE: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  PENDING_OWNERSHIP: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  APPROVED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  REJECTED: "bg-red-500/20 text-red-300 border-red-500/30",
  EXECUTING: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  EXECUTED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  EXECUTION_FAILED: "bg-red-600/20 text-red-400 border-red-600/30",
  ROLLED_BACK: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  CHANGES_REQUESTED: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

export default function ResolutionDetailDrawer({ resolution, open, onClose, onRefresh }) {
  const [user, setUser] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState("");
  const [signature, setSignature] = useState("");
  const [rollbackReason, setRollbackReason] = useState("");
  const [tab, setTab] = useState("details");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (resolution?.resolution_id && open) {
      fetchEvidence(resolution.resolution_id);
    }
  }, [resolution?.resolution_id, open]);

  const fetchEvidence = async (rid) => {
    setLoadingEvidence(true);
    try {
      const res = await base44.functions.invoke("financialResolutionWorkflow", { action: "get_evidence", resolution_id: rid });
      setEvidence(res.data);
    } catch (e) {
      console.error("Evidence fetch failed:", e);
    } finally {
      setLoadingEvidence(false);
    }
  };

  const doAction = async (action, extra = {}) => {
    setActionLoading(true);
    try {
      await base44.functions.invoke("financialResolutionWorkflow", {
        action,
        resolution_id: resolution.resolution_id,
        ...extra
      });
      await fetchEvidence(resolution.resolution_id);
      onRefresh();
    } catch (e) {
      console.error(`Action ${action} failed:`, e);
    } finally {
      setActionLoading(false);
    }
  };

  if (!resolution) return null;
  const status = resolution.approval_status;
  const canApprove = status?.startsWith("PENDING_") && !resolution.execution_locked;
  const canExecute = status === "APPROVED";
  const canRollback = status === "EXECUTED" && resolution.rollback_status !== "completed" && resolution.rollback_status !== "initiated";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-[#0a0a0a] border-white/10">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            {resolution.resolution_id}
          </SheetTitle>
          <SheetDescription className="text-white/50">
            Authorized Financial Resolution — W3-011 AFRW
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className={STATUS_COLORS[status] || "bg-white/10 text-white/60 border-white/20"}>
            {(status || "").replace(/_/g, " ")}
          </Badge>
          <Badge className="bg-white/10 text-white/60 border-white/20">
            {(resolution.resolution_type || "").replace(/_/g, " ")}
          </Badge>
          <Badge className="bg-white/10 text-white/60 border-white/20">
            ${((resolution.amount || 0)).toFixed(2)}
          </Badge>
          {resolution.execution_locked && (
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
              <Lock className="w-3 h-3 mr-1" /> LOCKED
            </Badge>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList className="bg-white/5">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3 mt-3">
            <DetailField label="Reason" value={resolution.reason} />
            <DetailField label="Business Justification" value={resolution.business_justification} />
            <DetailField label="Manager Notes" value={resolution.manager_notes || "—"} />
            <DetailField label="Exception ID" value={resolution.exception_id} mono />
            <DetailField label="Venue" value={resolution.venue_id} />
            <DetailField label="Requested By" value={`${resolution.requested_by} (${resolution.requested_by_role})`} />
            <DetailField label="Created" value={resolution.created_date?.substring(0, 19)} />

            {resolution.linked_financial_records?.length > 0 && (
              <div>
                <div className="text-xs text-white/50 mb-1">Linked Financial Records (immutable — never modified)</div>
                {resolution.linked_financial_records.map((rec, i) => (
                  <div key={i} className="text-xs font-mono text-cyan-300 bg-white/5 rounded px-2 py-1 mb-1">
                    {rec.entity_type}: {rec.entity_id}
                  </div>
                ))}
              </div>
            )}

            {resolution.execution_snapshot && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                <div className="text-xs text-emerald-300 font-medium mb-1">✓ Immutable Execution Snapshot Captured</div>
                <div className="text-xs text-white/50">
                  {Object.keys(resolution.execution_snapshot.records || {}).length} records snapshotted at {resolution.execution_snapshot.captured_at?.substring(0, 19)}
                </div>
              </div>
            )}

            {resolution.compensating_entry_ids?.length > 0 && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                <div className="text-xs text-blue-300 font-medium mb-1">Compensating Entries Created</div>
                {resolution.compensating_entry_ids.map((id, i) => (
                  <div key={i} className="text-xs font-mono text-cyan-300">{id}</div>
                ))}
              </div>
            )}

            {resolution.execution_error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-red-400 mb-1" />
                <div className="text-xs text-red-300 font-medium">Execution Error</div>
                <div className="text-xs text-white/60">{resolution.execution_error}</div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approvals" className="space-y-3 mt-3">
            <div className="text-xs text-white/50 mb-2">Required Approval Chain (computed from amount + type)</div>
            {(resolution.required_approval_levels || []).length === 0 && (
              <div className="text-xs text-white/40">No additional approvals required (manager-level authorization)</div>
            )}
            {(resolution.approval_chain || []).map((step, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                {step.status === "approved" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : step.status === "rejected" ? (
                  <XCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30" />
                )}
                <div className="flex-1">
                  <div className="text-sm text-white capitalize">{(step.level || "").replace(/_/g, " ")}</div>
                  {step.approver_email && (
                    <div className="text-xs text-white/50">{step.approver_email} — {step.action_time?.substring(0, 19)}</div>
                  )}
                </div>
                <Badge className={
                  step.status === "approved" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                  step.status === "rejected" ? "bg-red-500/20 text-red-300 border-red-500/30" :
                  "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }>{step.status}</Badge>
              </div>
            ))}

            {resolution.transition_history?.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-white/50 mb-2">Transition History</div>
                {resolution.transition_history.map((t, i) => (
                  <div key={i} className="text-xs text-white/60 border-l-2 border-white/10 pl-2 mb-1">
                    <span className="text-cyan-300">{t.from_status || "null"}</span> → <span className="text-cyan-300">{t.to_status}</span>
                    <div className="text-white/40">{t.changed_by} — {t.changed_at?.substring(0, 19)}</div>
                    {t.reason && <div className="text-white/40">{t.reason}</div>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="evidence" className="space-y-2 mt-3">
            {loadingEvidence ? (
              <div className="text-white/50 text-sm">Loading evidence chain...</div>
            ) : evidence?.evidence_logs ? (
              <>
                <div className="text-xs text-white/50 mb-2">Forensic Evidence Trail ({evidence.evidence_logs.length} entries)</div>
                {evidence.evidence_logs.map((log, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-2 border-l-2 border-cyan-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-cyan-300">{(log.log_type || "").replace(/_/g, " ")}</span>
                      <span className="text-xs text-white/40">{log.timestamp?.substring(0, 19)}</span>
                    </div>
                    <div className="text-xs text-white/50">{log.actor_email} ({log.actor_role})</div>
                    {log.previous_state && (
                      <div className="text-xs text-white/40">{log.previous_state} → {log.new_state}</div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-white/50 text-sm">No evidence logs yet</div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-2 mt-3">
            {(resolution.notifications_sent || []).length === 0 ? (
              <div className="text-white/50 text-sm">No notifications sent</div>
            ) : (
              resolution.notifications_sent.map((n, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-white/60 bg-white/5 rounded px-2 py-1">
                  <Bell className="w-3 h-3 text-cyan-400" />
                  <span className="font-medium">{n.type}</span>
                  <span className="text-white/40">→ {n.recipient}</span>
                  <span className="text-white/30 ml-auto">{n.sent_at?.substring(0, 19)}</span>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Action Panel */}
        <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
          {canApprove && (
            <div className="space-y-2">
              <Input
                placeholder="Signature / PIN verification token"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="bg-white/5 border-white/10"
              />
              <Textarea
                placeholder="Approval comments..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="bg-white/5 border-white/10"
              />
              <div className="flex gap-2">
                <Button onClick={() => doAction("approve", { signature, comments })} disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 flex-1">
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button onClick={() => doAction("reject", { reason: comments })} disabled={actionLoading}
                  variant="destructive" className="flex-1">
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button onClick={() => doAction("request_changes", { comments })} disabled={actionLoading}
                  variant="outline" className="border-white/10 bg-white/5">
                  Request Changes
                </Button>
              </div>
            </div>
          )}

          {canExecute && (
            <Button onClick={() => doAction("execute")} disabled={actionLoading}
              className="w-full bg-cyan-600 hover:bg-cyan-500">
              <Play className="w-4 h-4 mr-2" /> Execute Resolution
            </Button>
          )}

          {canRollback && (
            <div className="space-y-2">
              <Textarea
                placeholder="Rollback reason..."
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                className="bg-white/5 border-white/10"
              />
              <Button onClick={() => doAction("rollback", { reason: rollbackReason })} disabled={actionLoading}
                variant="outline" className="w-full border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20">
                <Undo2 className="w-4 h-4 mr-2" /> Rollback (creates compensating reversal)
              </Button>
            </div>
          )}

          {resolution.execution_locked && status === "EXECUTION_FAILED" && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-300">
              <Lock className="w-4 h-4 inline mr-1" />
              Execution lock is held due to failure. Manual intervention required. Lock is intentionally maintained to prevent partial mutations.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailField({ label, value, mono }) {
  return (
    <div>
      <div className="text-xs text-white/50">{label}</div>
      <div className={`text-sm text-white/90 ${mono ? "font-mono text-cyan-300" : ""}`}>{value || "—"}</div>
    </div>
  );
}