import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { isOwnerEmail } from "@/lib/nups/ownerEmails";

// Admin-only direct entry into the NUPS operator system (skips the kiosk PIN pad).
// Renders nothing for everyone else.
export default function AdminNupsBypass() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!(await base44.auth.isAuthenticated())) return;
        const me = await base44.auth.me();
        const ok = isOwnerEmail(me?.email) || me?.role === "admin";
        if (alive) setAllowed(ok);
      } catch {
        /* not signed in — stay hidden */
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!allowed) return null;

  return (
    <div className="flex justify-center py-3">
      <Link
        to="/RoleViews"
        className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full border border-cyan-400/40 bg-white/[0.04] backdrop-blur-md text-cyan-300 text-sm font-bold hover:bg-cyan-400/10 hover:border-cyan-300 transition-colors"
        style={{ boxShadow: "0 0 20px rgba(0,240,255,0.15)" }}
      >
        <ShieldCheck className="w-4 h-4" />
        Admin — Enter NUPS
      </Link>
    </div>
  );
}