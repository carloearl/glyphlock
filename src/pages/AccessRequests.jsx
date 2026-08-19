import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck } from "lucide-react";

const STATUS_COLORS = {
  PENDING_OWNER_APPROVAL: "bg-amber-600",
  NEEDS_INFORMATION: "bg-blue-600",
  APPROVED: "bg-emerald-600",
  REJECTED: "bg-red-700",
  SUSPENDED: "bg-orange-700",
  REVOKED: "bg-red-900",
};

// DACO-NUPS-ROLE-VIP-BUILD-20260717 §5 — Owner approval console.
// Route is ADMIN-guarded; every action is re-verified server-side (owner authority only).
// Decision lockdown (owner directive 2026-07-21): only Carlo Earl's accounts
// see and use the decision buttons. Server enforces the same rule.
const DECISION_EMAILS = ["carloearl@glyphlock.com", "carloearl@gmail.com"];

const STAFF_ROLES = ["ENTERTAINER", "HOSTESS", "DOORMAN", "DOOR_GIRL", "BARTENDER", "DJ", "SECURITY", "MANAGER"];

export default function AccessRequests() {
  const [requests, setRequests] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [canDecide, setCanDecide] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then((me) => setCanDecide(DECISION_EMAILS.includes(String(me?.email || "").toLowerCase())))
      .catch(() => setCanDecide(false));
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("nupsAccessControl", { action: "listRequests" });
      setRequests(res.data?.requests || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Unable to load requests.");
      setRequests([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const decide = async (id, decision) => {
    let note = "";
    if (["REJECT", "REQUEST_INFO", "SUSPEND", "REVOKE"].includes(decision)) {
      note = window.prompt("Reason / note for this decision:") || "";
    }
    setBusyId(id);
    setError("");
    try {
      await base44.functions.invoke("nupsAccessControl", { action: "decide", request_id: id, decision, note });
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || "Decision failed.");
    } finally {
      setBusyId(null);
    }
  };

  if (requests === null) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <header className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-7 h-7 text-violet-400" />
        <div>
          <h1 className="text-xl font-bold">NUPS Access Requests</h1>
          <p className="text-sm text-slate-500">Approval authority: Carlo Earl only. Self-approval is blocked server-side.</p>
        </div>
      </header>

      {/* One state at a time — an error and an empty-list message shown
          together read as contradictory (audit 2026-07-20). */}
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {!error && requests.length === 0 && <p className="text-slate-500">No access requests.</p>}

      <div className="space-y-3 max-w-3xl">
        {requests.map((r) => (
          <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-semibold">{r.full_legal_name}</span>
              <span className="text-slate-500 text-sm">{r.email}</span>
              <Badge className="bg-slate-700 text-white">{r.requested_role}</Badge>
              <Badge className={`${STATUS_COLORS[r.status] || "bg-slate-600"} text-white`}>{r.status.replaceAll("_", " ")}</Badge>
              {r.mode === "TEST" && <Badge className="bg-amber-700 text-white">TEST</Badge>}
              {r.mode === "DEMO" && <Badge className="bg-emerald-700 text-white">TRAINING</Badge>}
            </div>
            <p className="text-sm text-slate-400 mb-1">{r.reason}</p>
            <p className="text-xs text-slate-600">
              Requested {new Date(r.created_date).toLocaleString()}
              {r.decided_by && <> · Decided by {r.decided_by} {r.decided_at && `on ${new Date(r.decided_at).toLocaleString()}`}</>}
              {r.decision_note && <> · "{r.decision_note}"</>}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {canDecide && ["PENDING_OWNER_APPROVAL", "NEEDS_INFORMATION", "SUSPENDED"].includes(r.status) && (
                <>
                  {r.requested_role === "ENTERTAINER" && <Button size="sm" disabled={busyId === r.id} onClick={() => decide(r.id, "APPROVE_ENTERTAINER")} className="bg-pink-700 hover:bg-pink-600 min-h-[44px]">Approve as Entertainer</Button>}
                  {STAFF_ROLES.includes(r.requested_role) && r.requested_role !== "ENTERTAINER" && (
                    <Button size="sm" disabled={busyId === r.id} onClick={() => decide(r.id, "APPROVE_STAFF")} className="bg-cyan-700 hover:bg-cyan-600 min-h-[44px]">
                      Approve as {r.requested_role.replaceAll("_", " ")}
                    </Button>
                  )}
                  <Button size="sm" disabled={busyId === r.id} onClick={() => decide(r.id, "APPROVE_ADMIN")} className="bg-emerald-700 hover:bg-emerald-600 min-h-[44px]">Approve as Administrator</Button>
                  <Button size="sm" disabled={busyId === r.id} onClick={() => decide(r.id, "APPROVE_OWNER")} className="bg-violet-700 hover:bg-violet-600 min-h-[44px]">Approve as Owner</Button>
                  <Button size="sm" disabled={busyId === r.id} onClick={() => decide(r.id, "REJECT")} variant="destructive" className="min-h-[44px]">Reject</Button>
                  {r.status !== "NEEDS_INFORMATION" && (
                    <Button size="sm" disabled={busyId === r.id} onClick={() => decide(r.id, "REQUEST_INFO")} variant="outline" className="border-slate-600 text-slate-300 min-h-[44px]">Request Info</Button>
                  )}
                </>
              )}
              {canDecide && r.status === "APPROVED" && (
                <>
                  <Button size="sm" disabled={busyId === r.id} onClick={() => decide(r.id, "SUSPEND")} className="bg-orange-800 hover:bg-orange-700 min-h-[44px]">Suspend</Button>
                  <Button size="sm" disabled={busyId === r.id} onClick={() => decide(r.id, "REVOKE")} variant="destructive" className="min-h-[44px]">Revoke</Button>
                </>
              )}
              {busyId === r.id && <Loader2 className="w-5 h-5 animate-spin text-slate-400 self-center" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}