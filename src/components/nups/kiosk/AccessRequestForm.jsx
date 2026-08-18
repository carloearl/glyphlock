import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { loadMyAccessRequests, submitAccessRequest } from "@/lib/nups/accessRequestClient";

const STATUS_COLORS = {
  PENDING_OWNER_APPROVAL: "bg-amber-600",
  NEEDS_INFORMATION: "bg-blue-600",
  APPROVED: "bg-emerald-600",
  REJECTED: "bg-red-700",
  SUSPENDED: "bg-orange-700",
  REVOKED: "bg-red-900",
};

// DACO-NUPS-ROLE-VIP-BUILD-20260717 §4 — Owner/Admin access request.
// Requires platform sign-in (verified email). Requests start PENDING_OWNER_APPROVAL
// and never create active access by themselves.
export default function AccessRequestForm({ requestedMode = "TEST" }) {
  const [authed, setAuthed] = useState(null);
  const [form, setForm] = useState({ full_legal_name: "", phone: "", requested_role: "ENTERTAINER", reason: "", mode: requestedMode });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    (async () => {
      const ok = await base44.auth.isAuthenticated();
      setAuthed(ok);
      if (ok) {
        setMyRequests(await loadMyAccessRequests());
      }
    })();
  }, []);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const request = await submitAccessRequest(form);
      setMyRequests([request, ...myRequests]);
      setForm({ full_legal_name: "", phone: "", requested_role: "ENTERTAINER", reason: "", mode: requestedMode });
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Unable to submit request.");
    } finally {
      setBusy(false);
    }
  };

  if (authed === null) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  if (!authed) {
    return (
      <div className="text-center space-y-4">
        <p className="text-slate-400 text-sm">Verify your email by signing in before requesting access.</p>
        <Button onClick={() => base44.auth.redirectToLogin(`/NUPSKiosk?panel=${requestedMode === "DEMO" ? "trainingRequest" : "testRequest"}`)} className="w-full h-14 bg-cyan-700 hover:bg-cyan-600">
          Sign In to Continue
        </Button>
      </div>
    );
  }

  const hasOpen = myRequests.some((r) => ["PENDING_OWNER_APPROVAL", "NEEDS_INFORMATION"].includes(r.status));

  return (
    <div className="space-y-4">
      <div className={`rounded-lg border px-3 py-2 text-center text-xs font-bold tracking-wide ${requestedMode === "DEMO" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"}`}>
        {requestedMode === "DEMO" ? "TRAINING ACCESS REQUEST" : "TEST ACCESS REQUEST"}
      </div>
      {myRequests.length > 0 && (
        <div className="space-y-2">
          {myRequests.map((r) => (
            <div key={r.id} className="p-3 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-between gap-2">
              <div className="text-sm text-slate-300">{r.requested_role} · {r.mode === "DEMO" ? "TRAINING" : r.mode || "TEST"} — {new Date(r.created_date).toLocaleDateString()}</div>
              <Badge className={`${STATUS_COLORS[r.status] || "bg-slate-600"} text-white`}>{r.status.replaceAll("_", " ")}</Badge>
            </div>
          ))}
        </div>
      )}
      {!hasOpen && !myRequests.some((r) => r.status === "APPROVED") && (
        <>
          <Input placeholder="Full legal name" value={form.full_legal_name}
            onChange={(e) => setForm({ ...form, full_legal_name: e.target.value })} className="h-12 bg-slate-900 border-slate-700 text-white" />
          <Input placeholder="Mobile number" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12 bg-slate-900 border-slate-700 text-white" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {["ENTERTAINER", "ADMINISTRATOR", "OWNER"].map((r) => (
              <button key={r} onClick={() => setForm({ ...form, requested_role: r })}
                className={`h-12 rounded-lg border text-sm font-semibold ${form.requested_role === r ? "bg-violet-700 border-violet-500 text-white" : "bg-slate-900 border-slate-700 text-slate-400"}`}>
                {r}
              </button>
            ))}
          </div>
          <Textarea placeholder="Reason for access" value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })} className="bg-slate-900 border-slate-700 text-white" rows={3} />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button onClick={submit} disabled={busy || !form.full_legal_name || !form.reason}
            className="w-full h-14 bg-violet-700 hover:bg-violet-600">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Access Request"}
          </Button>
          <p className="text-xs text-slate-500 text-center">
            Requests are reviewed by the venue Owner. Approval is required before any NUPS site access is granted.
          </p>
        </>
      )}
    </div>
  );
}