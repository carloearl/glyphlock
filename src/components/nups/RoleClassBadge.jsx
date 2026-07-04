/**
 * RoleClassBadge — DACO 003 §2 constant visual proof of role scoping.
 *
 * Persistent bottom-right pill that always shows the current user's
 * resolved role class (STAFF · ENTERTAINER · MANAGER · ADMIN). Read-only,
 * non-interactive except for a tooltip. Renders on every NUPS surface
 * so an operator can never mistake which role they're acting as.
 */

import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { isSovereign } from "@/lib/nups/sovereign";
import { resolveRoleClass } from "@/lib/nups/roleClass";

const TONE = {
  STAFF:       { ring: "ring-cyan-500/40",    text: "text-cyan-300",    dot: "bg-cyan-400" },
  ENTERTAINER: { ring: "ring-pink-500/40",    text: "text-pink-300",    dot: "bg-pink-400" },
  MANAGER:     { ring: "ring-violet-500/40",  text: "text-violet-300",  dot: "bg-violet-400" },
  ADMIN:       { ring: "ring-emerald-500/40", text: "text-emerald-300", dot: "bg-emerald-400" },
};

export default function RoleClassBadge() {
  const [cls, setCls] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) return;
        const u = await base44.auth.me();
        let nu = null, sov = false;
        try {
          const matches = await base44.entities.NUPSUser.filter({ created_by: u.email });
          nu = (matches || [])[0] || null;
          sov = (matches || []).some(isSovereign);
        } catch { /* fall through */ }
        if (!cancelled) setCls(resolveRoleClass({ user: u, nupsUser: nu, sovereign: sov }));
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!cls) return null;
  const tone = TONE[cls] || TONE.STAFF;

  return (
    <div
      className={`fixed bottom-3 right-3 z-[60] pointer-events-none select-none
                  flex items-center gap-2 px-3 py-1.5 rounded-full
                  bg-black/70 backdrop-blur ring-1 ${tone.ring}`}
      role="status"
      aria-label={`Role class: ${cls}`}
      title={`DACO 003 §2 — you are acting as ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot} animate-pulse`} />
      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Role</span>
      <span className={`text-[11px] font-black tracking-wide ${tone.text}`}>{cls}</span>
    </div>
  );
}