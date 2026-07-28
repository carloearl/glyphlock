import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { isOwnerEmail } from "@/lib/nups/ownerEmails";

// DACO-NUPS-ROLE-VIP-BUILD-20260717 §6 — Owner/Admin sign-in.
// Platform authentication first, then server-side approval check before the back office opens.
// Carlo's owner emails (carloearl@glyphlock.com / carloearl@gmail.com) bypass
// the backend approval check — they are sovereign authority.
export default function OwnerAdminSignIn() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState("");

  const signIn = async () => {
    setBusy(true);
    setDenied("");
    try {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        base44.auth.redirectToLogin("/NUPSKiosk?panel=admin");
        return;
      }
      const me = await base44.auth.me();
      // Carlo's owner emails — sovereign bypass, no backend call needed.
      if (isOwnerEmail(me?.email)) {
        navigate("/RoleViews");
        return;
      }
      const res = await base44.functions.invoke("nupsAccessControl", { action: "checkAccess" });
      if (res.data?.authorized) {
        // Authorized Owner/Admin lands on the Role Views picker — choose any
        // role's live workspace (Hostess, Door Girl, DJ, Manager, Owner, …).
        navigate("/RoleViews");
      } else {
        setDenied(res.data?.reason || "Access denied.");
      }
    } catch (e) {
      setDenied(e?.response?.data?.error || "Unable to verify access.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="text-center space-y-4">
      <p className="text-slate-400 text-sm">
        Back-office access is limited to verified Owners and approved Administrators.
      </p>
      <Button onClick={signIn} disabled={busy} className="w-full h-14 text-base bg-violet-700 hover:bg-violet-600">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : (<><ShieldCheck className="w-5 h-5 mr-2" /> Sign In & Open Back Office</>)}
      </Button>
      {denied && (
        <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-sm flex items-start gap-2 text-left">
          <ShieldX className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{denied}</span>
        </div>
      )}
    </div>
  );
}