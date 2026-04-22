/**
 * CommandCenterDemo — /demo/command-center
 * Prospect-facing Command Center running in DEMO mode with seeded data only.
 */
import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import DemoShell from "@/components/demo/DemoShell";
import DemoStatusCard from "@/components/demo/DemoStatusCard";
import DemoActionButton from "@/components/demo/DemoActionButton";
import { DEMO_SEED, DEMO_VENUE_NAME, fmtUSD } from "@/components/demo/demoSeedData";
import { getSession, clearSession, getDeviceFingerprint } from "@/lib/demoSession";
import {
  DollarSign, Banknote, DoorOpen, FileSignature, Crown, Bell,
  Play, Users, CreditCard, Lock, Clipboard, Shield, LogOut,
} from "lucide-react";

export default function CommandCenterDemo() {
  const navigate = useNavigate();

  const logAction = useCallback(async (action) => {
    const session = getSession();
    if (!session?.leadId) return;
    try {
      await base44.functions.invoke("demoLogAction", {
        lead_id: session.leadId,
        action,
        source_route: "CommandCenterDemo",
        device_fingerprint: getDeviceFingerprint(),
      });
    } catch (_) { /* non-blocking */ }
  }, []);

  const handleExit = async () => {
    const session = getSession();
    if (session?.leadId) {
      try {
        await base44.functions.invoke("demoSessionEnd", { lead_id: session.leadId, reason: "completed" });
      } catch (_) { /* non-blocking */ }
    }
    clearSession();
    navigate("/", { replace: true });
  };

  const onAction = (name, to) => async () => {
    await logAction(name);
    if (to) navigate(to);
  };

  return (
    <DemoShell>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px 48px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#eab308", fontWeight: 600 }}>
              Command Center · {DEMO_VENUE_NAME}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: "6px 0 0", letterSpacing: "-0.02em", color: "#fafafa" }}>
              Tonight at a glance
            </h1>
          </div>
          <button
            onClick={handleExit}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              minHeight: 44,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10,
              color: "#fca5a5",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.05em",
              cursor: "pointer",
              touchAction: "manipulation",
            }}
          >
            <LogOut style={{ width: 14, height: 14, pointerEvents: "none" }} />
            <span style={{ pointerEvents: "none" }}>Exit Demo</span>
          </button>
        </div>

        {/* Status card grid — 6 cards, Tonight Sales + Cash Position dominant top-left */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
            marginBottom: 28,
          }}
        >
          <div style={{ gridColumn: "span 2" }}>
            <DemoStatusCard
              label="Tonight Sales"
              value={fmtUSD(DEMO_SEED.total_sales)}
              sublabel={`Cash ${fmtUSD(DEMO_SEED.cash_sales)} · Card ${fmtUSD(DEMO_SEED.card_sales)}`}
              emphasis="primary"
              icon={DollarSign}
            />
          </div>
          <DemoStatusCard
            label="Cash Position"
            value={fmtUSD(DEMO_SEED.cash_position)}
            sublabel="Drawer total · live"
            emphasis="primary"
            icon={Banknote}
          />
          <DemoStatusCard
            label="Open Batch"
            value={DEMO_SEED.batch.status}
            sublabel={DEMO_SEED.batch.opened_display}
            icon={DoorOpen}
          />
          <DemoStatusCard
            label="VIP Rooms Active"
            value={`${DEMO_SEED.vip_rooms_active} / ${DEMO_SEED.vip_rooms_total}`}
            sublabel="In session"
            icon={Crown}
          />
          <DemoStatusCard
            label="Pending Contracts"
            value={DEMO_SEED.pending_contracts}
            sublabel="Awaiting signature"
            icon={FileSignature}
          />
        </div>

        {/* Alerts row */}
        <div
          style={{
            marginBottom: 28,
            padding: 18,
            background: "linear-gradient(180deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Bell style={{ width: 14, height: 14, color: "#ef4444" }} />
            <span style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#fca5a5", fontWeight: 600 }}>
              Alerts · {DEMO_SEED.alerts.length}
            </span>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {DEMO_SEED.alerts.map((a) => (
              <li key={a.id} style={{ fontSize: 14, color: a.severity === "warn" ? "#fca5a5" : "#d4d4d4" }}>
                • {a.message}
              </li>
            ))}
          </ul>
        </div>

        {/* Primary action buttons */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#a3a3a3", fontWeight: 600, marginBottom: 12 }}>
            Primary Actions
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <DemoActionButton label="Open Night" icon={Play} variant="primary" onClick={onAction("open_night", "/demo/open-night-preview")} />
            <DemoActionButton label="VIP Board" icon={Crown} onClick={onAction("vip_board", "/demo/vip-board-preview")} />
            <DemoActionButton label="POS Register" icon={CreditCard} onClick={onAction("pos_register", "/demo/pos-register-preview")} />
            <DemoActionButton label="Close Night" icon={Lock} variant="danger" onClick={onAction("close_night", "/demo/close-night-preview")} />
            <DemoActionButton label="Floor Status" icon={Users} onClick={onAction("floor_status", "/demo/floor-status")} />
            <DemoActionButton label="Compliance" icon={Shield} onClick={onAction("compliance", "/demo/compliance-preview")} />
          </div>
        </div>

        {/* Methodology footer */}
        <p style={{ marginTop: 28, fontSize: 12, color: "#737373", textAlign: "center", letterSpacing: "0.02em" }}>
          Tonight Sales = Cash + Card. GlyphBucks liability tracked separately ({fmtUSD(DEMO_SEED.glyphbucks_liability)}) — not included in Tonight Sales.
        </p>
      </div>
    </DemoShell>
  );
}