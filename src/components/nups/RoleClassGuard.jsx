/**
 * RoleClassGuard — DACO Directive 003 §2 enforcement at the page level.
 *
 * Wraps a page/component and only renders it if the current user's resolved
 * role class is in `allow`. Otherwise redirects to that user's own class
 * home. This closes the deep-link gap that sidebar-hiding alone leaves open.
 *
 * Usage:
 *   <RoleClassGuard allow={["ADMIN"]}>
 *     <NUPSOwner />
 *   </RoleClassGuard>
 *
 * Phase 1 scope: navigation gating only — no business-logic changes.
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { isSovereign } from "@/lib/nups/sovereign";
import { resolveRoleClass, homeForRoleClass, ROLE_CLASS } from "@/lib/nups/roleClass";

export default function RoleClassGuard({ allow = [], children }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | granted | denied | unauth
  const [roleClass, setRoleClass] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) { if (!cancelled) setStatus("unauth"); return; }
        const u = await base44.auth.me();

        let nu = null, sov = false;
        try {
          const matches = await base44.entities.NUPSUser.filter({ created_by: u.email });
          nu = (matches || [])[0] || null;
          sov = (matches || []).some(isSovereign);
        } catch { /* fall through */ }

        const cls = resolveRoleClass({ user: u, nupsUser: nu, sovereign: sov });
        if (cancelled) return;
        setRoleClass(cls);

        // ADMIN is a superset — always granted.
        if (cls === ROLE_CLASS.ADMIN) { setStatus("granted"); return; }

        if (allow.includes(cls)) setStatus("granted");
        else setStatus("denied");
      } catch {
        if (!cancelled) setStatus("unauth");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto" />
          <p className="text-gray-600 text-sm">Verifying role scope…</p>
        </div>
      </div>
    );
  }

  if (status === "unauth") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-gray-900/80 border border-yellow-500/20 rounded-2xl p-8 text-center space-y-5">
          <Lock className="w-12 h-12 text-yellow-400 mx-auto" />
          <h2 className="text-xl font-bold">Sign in required</h2>
          <Button onClick={() => navigate("/NUPSGateway")} className="w-full bg-gradient-to-r from-violet-600 to-blue-600">
            Go to Access Gateway
          </Button>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    const home = homeForRoleClass(roleClass);
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-gray-900/80 border border-red-500/20 rounded-2xl p-8 text-center space-y-5">
          <Lock className="w-12 h-12 text-red-400 mx-auto" />
          <div>
            <h2 className="text-xl font-bold">Not your workflow</h2>
            <p className="text-gray-500 text-sm mt-2">
              This screen belongs to another role. Your role class is{" "}
              <span className="text-cyan-400 font-mono">{roleClass}</span>.
            </p>
          </div>
          <Button
            onClick={() => navigate(home)}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600"
          >
            Go to My Home
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}