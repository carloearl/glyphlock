/**
 * W3-012A — Workspace Switcher
 * ─────────────────────────────
 * Visible workspace selector in the NUPSAppShell top bar.
 * Shows only workspaces allowed by the authenticated user's role class.
 * Users with multiple roles may switch workspaces without logging out.
 *
 * NON-DESTRUCTIVE: Does not change routing or permissions — adds a
 * workspace selection layer on top of the existing navigation.
 */
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, Check } from "lucide-react";
import { WORKSPACES, getWorkspacesForClass, getWorkspaceForPath } from "@/lib/nups/workspaceConfig";
import { ROLE_CLASS } from "@/lib/nups/roleClass";

const COLOR_CLASSES = {
  emerald: { text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  cyan:     { text: "text-cyan-300",    bg: "bg-cyan-500/10",    border: "border-cyan-500/30",    dot: "bg-cyan-400" },
  violet:   { text: "text-violet-300",  bg: "bg-violet-500/10",  border: "border-violet-500/30",  dot: "bg-violet-400" },
  amber:    { text: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   dot: "bg-amber-400" },
  yellow:   { text: "text-yellow-300",  bg: "bg-yellow-500/10",  border: "border-yellow-500/30",  dot: "bg-yellow-400" },
  slate:    { text: "text-slate-300",   bg: "bg-slate-500/10",   border: "border-slate-500/30",   dot: "bg-slate-400" },
};

export default function WorkspaceSwitcher({ roleClass = ROLE_CLASS.ADMIN, platformAdmin = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // A platform-admin ACCOUNT always sees the full workspace list — even
  // while PIN-clocked-in as staff. This dropdown is the only path back to
  // admin besides clocking out. Everyone else sees only their class's
  // workspaces.
  const availableWorkspaces = useMemo(
    () => getWorkspacesForClass(platformAdmin ? ROLE_CLASS.ADMIN : roleClass),
    [roleClass, platformAdmin]
  );

  const activeWorkspaceId = useMemo(
    () => getWorkspaceForPath(location.pathname, roleClass) || availableWorkspaces[0]?.id,
    [location.pathname, availableWorkspaces, roleClass]
  );

  const activeWorkspace = WORKSPACES[activeWorkspaceId] || availableWorkspaces[0];
  const colors = COLOR_CLASSES[activeWorkspace?.color] || COLOR_CLASSES.slate;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (ws) => {
    setOpen(false);
    // Platform admin picking a workspace ABOVE the clocked-in operator's
    // class = deliberately leaving staff mode. Clear the operator session
    // so full admin scope is restored before navigating.
    if (platformAdmin && !ws.allowedClasses.includes(roleClass)) {
      sessionStorage.removeItem("nups_kiosk_operator");
      sessionStorage.removeItem("nups_kiosk_session");
      window.dispatchEvent(new Event("nups:operator-changed"));
    }
    navigate(ws.home);
  };

  if (!activeWorkspace || availableWorkspaces.length === 0) return null;

  const Icon = activeWorkspace.icon;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colors.bg} ${colors.border} ${colors.text} text-[12px] font-semibold hover:brightness-125 transition-all min-h-[36px]`}
        title={`Workspace: ${activeWorkspace.label}`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">{activeWorkspace.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-white/5">
            <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-slate-500">
              Switch Workspace
            </div>
          </div>
          <div className="py-1">
            {availableWorkspaces.map((ws) => {
              const wsColors = COLOR_CLASSES[ws.color] || COLOR_CLASSES.slate;
              const WsIcon = ws.icon;
              const isActive = ws.id === activeWorkspaceId;
              return (
                <button
                  key={ws.id}
                  onClick={() => handleSelect(ws)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors ${isActive ? "bg-white/[0.02]" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-lg ${wsColors.bg} ${wsColors.border} border flex items-center justify-center shrink-0 mt-0.5`}>
                    <WsIcon className={`w-4 h-4 ${wsColors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-white">{ws.label}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{ws.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="px-3 py-2 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />
              Role: {roleClass}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}