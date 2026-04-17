import React from "react";

/**
 * NUPSArchitectureSections
 * §11 Hybrid Architecture · §12 Failsafe & Resilience · §13 Implementation Status
 * Extracted from NUPSLanding to keep main file under line limit.
 * Consumes the same CSS variables + .section-header styles defined on the landing shell.
 */
export default function NUPSArchitectureSections() {
  const hybrid = [
    {
      k: "Edge · Client Layer",
      c: "#00d4ff",
      body:
        "Raspberry Pi nodes and Samsung tablets at the venue. Handles identity capture, POS transactions, biometric verification, and real-time floor operations. Must function offline.",
      tag: "LOCAL · REAL-TIME",
    },
    {
      k: "Server · Cloud Layer",
      c: "#8b5cf6",
      body:
        "System of record. Handles persistent storage, audit logging, dispute-package assembly, cross-venue orchestration, and reporting. All evidence lives here.",
      tag: "PERSISTENT · AUTHORITATIVE",
    },
    {
      k: "Sync Behavior",
      c: "#10b981",
      body:
        "Edge syncs to server in real time when online, and on reconnect when offline. Idempotent writes. No data loss. Once synced, records become auditable and permanent.",
      tag: "REAL-TIME · RESILIENT",
    },
  ];

  const failsafe = [
    { k: "Offline Operation", v: "Edge nodes continue full venue ops — POS, ID, contracts, payouts — without internet.", c: "#00d4ff" },
    { k: "Sync on Reconnect", v: "Buffered transactions flush to the server on reconnect. Idempotent · conflict-resolved.", c: "#1e6fff" },
    { k: "Dual-Network", v: "Venue Wi-Fi primary + AT&T LTE failover. Automatic switchover on loss.", c: "#8b5cf6" },
    { k: "Zero Data Loss", v: "Local append-only journal persists every event until server-confirmed.", c: "#10b981" },
  ];

  const live = [
    "Multi-tenant platform + 7-tier RBAC",
    "Identity capture (ID · mag-stripe · QR)",
    "POS + cash drawer reconciliation",
    "VIP contract: print → sign → rescan",
    "GlyphBucks SVC issuance",
    "Stripe + GoDaddy payment routing",
    "Driver payout engine",
    "SystemAuditLog + AuditEvent dual-ledger",
  ];

  const expansion = [
    "Biometric shift tracking",
    "One-push Dispute Shield packaging",
    "Blockchain timestamp anchoring",
    "DJ rotation engine",
    "QR marketing + social automation",
    "Additional processor integrations",
    "Multi-venue cross-reporting",
  ];

  const configurable = [
    "Rate card (cover · payouts · bonuses)",
    "Tip pool split configuration",
    "GlyphBucks denominations + expiry",
    "Role matrix customization",
    "Video attestation capture",
    "SMS / email campaign templates",
    "Processor selection per venue",
  ];

  const panelBg = { background: "linear-gradient(180deg, var(--abyss), var(--deep))", padding: "32px 26px", position: "relative" };
  const topBar = (c) => ({ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: c, boxShadow: `0 0 12px ${c}` });
  const labelStyle = (c) => ({ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.28em", color: c, textTransform: "uppercase", marginBottom: 14 });

  return (
    <>
      {/* § 11 · HYBRID ARCHITECTURE */}
      <div className="section-header"><h2>Hybrid <b>Architecture</b></h2><div className="index">§ 11 · Edge + Server</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--line)", border: "1px solid var(--line)", marginBottom: 48 }}>
        {hybrid.map((r) => (
          <div key={r.k} style={panelBg}>
            <div style={topBar(r.c)} />
            <div style={labelStyle(r.c)}>◆ {r.k}</div>
            <div style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.55, marginBottom: 14 }}>{r.body}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "var(--ink-dim)", textTransform: "uppercase", paddingTop: 10, borderTop: "1px dashed var(--line)" }}>{r.tag}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 96, padding: "20px 24px", border: "1px solid var(--violet)", background: "rgba(139,92,246,0.06)", fontSize: 15, color: "var(--ink)", lineHeight: 1.6 }}>
        <b style={{ color: "var(--violet)" }}>System of record:</b> the cloud server. The edge is the capture surface — fast, offline-capable, and authoritative only until sync. After sync, the server is the canonical ledger for audit, dispute, and reporting.
      </div>

      {/* § 12 · FAILSAFE & RESILIENCE */}
      <div className="section-header"><h2>Failsafe <b>&amp; Resilience</b></h2><div className="index">§ 12 · Continuity</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--line)", border: "1px solid var(--line)", marginBottom: 96 }}>
        {failsafe.map((r) => (
          <div key={r.k} style={panelBg}>
            <div style={topBar(r.c)} />
            <div style={labelStyle(r.c)}>◆ {r.k}</div>
            <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.5 }}>{r.v}</div>
          </div>
        ))}
      </div>

      {/* § 13 · IMPLEMENTATION STATUS */}
      <div className="section-header"><h2>Implementation <b>Status</b></h2><div className="index">§ 13 · Honest Capability Map</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--line)", border: "1px solid var(--line)", marginBottom: 96 }}>
        <StatusColumn color="#10b981" title="Live" sub="Currently functioning in production" items={live} />
        <StatusColumn color="#fbbf24" title="Deployment / Expansion" sub="Built — rolling out per venue" items={expansion} />
        <StatusColumn color="#8b5cf6" title="Configurable / Optional" sub="Available — enabled per venue" items={configurable} />
      </div>
    </>
  );
}

function StatusColumn({ color, title, sub, items }) {
  return (
    <div style={{ background: "linear-gradient(180deg, var(--abyss), var(--deep))", padding: "32px 26px", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color, boxShadow: `0 0 12px ${color}` }} />
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.28em", color, textTransform: "uppercase", marginBottom: 14 }}>◆ {title}</div>
      <div style={{ fontSize: 13, color: "var(--ink-bright)", fontWeight: 600, marginBottom: 10 }}>{sub}</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13, color: "var(--ink)", lineHeight: 1.7 }}>
        {items.map((it) => (<li key={it}>◆ {it}</li>))}
      </ul>
    </div>
  );
}