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
        "Raspberry Pi nodes and Samsung tablets are supported venue surfaces for identity capture, POS activity, hardware-assisted verification, and floor operations. Supported writes can queue locally when connectivity drops; some validation still requires the server.",
      tag: "LIVE CORE · OFFLINE-ASSISTED",
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
        "Supported offline transactions queue in IndexedDB and sync on reconnect. Server-side records become the canonical audit source after sync. Full offline coverage and recovery certification are still expanding.",
      tag: "IMPLEMENTED QUEUE · EXPANDING COVERAGE",
    },
  ];

  const failsafe = [
    { k: "Offline-Assisted Operation", v: "Supported transaction writes can queue locally during an outage; server-required validation is clearly blocked rather than faked.", c: "#00d4ff" },
    { k: "Sync on Reconnect", v: "Queued IndexedDB transactions are retried when connectivity returns and successful sync is surfaced to the operator.", c: "#1e6fff" },
    { k: "Dual-Network", v: "Venue Wi-Fi plus LTE failover is a deployment option; automatic network failover must be validated per installed venue.", c: "#8b5cf6" },
    { k: "Recovery Roadmap", v: "Durable local queuing exists now; full end-to-end recovery certification across every NUPS workflow remains in expansion.", c: "#10b981" },
  ];

  const live = [
    "Multi-tenant platform + role-scoped access controls",
    "Identity capture workflows (ID · mag-stripe · QR)",
    "POS + cash drawer reconciliation",
    "GlyphBucks issuance, redemption, ledger + QR verification",
    "Stripe API payment verification + webhook infrastructure",
    "Driver QR / payout infrastructure",
    "SystemAuditLog + AuditEvent audit layers",
    "Ed25519 sealing + OpenTimestamps submission for supported sealed flows",
  ];

  const expansion = [
    "VIP contract workflow — venue-by-venue production validation",
    "Physical biometric hardware validation + shift tracking rollout",
    "Dispute evidence final-PDF compiler + one-push operator workflow",
    "Direct processor dispute-API submission",
    "DJ rotation integration into the primary NUPS operating surface",
    "Expanded offline coverage + recovery certification",
    "Multi-venue cross-reporting",
  ];

  const configurable = [
    "Bring-your-own processor / existing terminal overlay",
    "Optional native API / webhook processor integrations",
    "Rate card (cover · payouts · bonuses)",
    "Tip pool split configuration",
    "GlyphBucks denominations + expiry",
    "Role matrix customization",
    "Video attestation capture",
    "SMS / email campaign templates",
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
        <StatusColumn color="#10b981" title="Implemented Core" sub="Verified in the current build; production use still depends on venue configuration and live transaction history" items={live} />
        <StatusColumn color="#fbbf24" title="Deployment / Expansion" sub="Built or partially built — being completed and validated per venue" items={expansion} />
        <StatusColumn color="#8b5cf6" title="Processor Overlay / Integration" sub="Keep the venue's existing merchant processing by default; add native API/webhook integrations only where useful" items={configurable} />
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