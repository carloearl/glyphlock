/**
 * PreviewPageShell — Shared layout for each /demo/*-preview module page.
 * Each preview page supplies: title, subtitle, description, icon, referralSource.
 * Shell renders header, back link, walkthrough CTA, phase indicator, and modal.
 */
import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import DemoShell from "@/components/demo/DemoShell";
import WalkthroughRequestModal from "@/components/demo/WalkthroughRequestModal";
import { getSession, getDeviceFingerprint } from "@/lib/demoSession";
import { ArrowLeft, Calendar } from "lucide-react";

export default function PreviewPageShell({ title, subtitle, description, icon: Icon, referralSource, children }) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  // Audit log: page view
  useEffect(() => {
    const session = getSession();
    if (!session?.leadId) return;
    base44.functions.invoke("demoLogAction", {
      lead_id: session.leadId,
      action: `preview_view:${referralSource}`,
      source_route: referralSource,
      device_fingerprint: getDeviceFingerprint(),
    }).catch(() => { /* non-blocking */ });
  }, [referralSource]);

  const handleCTAClick = useCallback(async () => {
    const session = getSession();
    if (session?.leadId) {
      base44.functions.invoke("demoLogAction", {
        lead_id: session.leadId,
        action: `walkthrough_cta_click:${referralSource}`,
        source_route: referralSource,
        device_fingerprint: getDeviceFingerprint(),
      }).catch(() => {});
    }
    setModalOpen(true);
  }, [referralSource]);

  return (
    <DemoShell>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 48px" }}>
        <button
          onClick={() => navigate("/demo/command-center")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            minHeight: 44,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            color: "#d4d4d4",
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 24,
            touchAction: "manipulation",
          }}
        >
          <ArrowLeft style={{ width: 14, height: 14, pointerEvents: "none" }} />
          <span style={{ pointerEvents: "none" }}>Back to Command Center</span>
        </button>

        {/* Icon + title block */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
          {Icon && (
            <div
              style={{
                width: 56,
                height: 56,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                background: "rgba(234,179,8,0.12)",
                border: "1px solid rgba(234,179,8,0.3)",
              }}
            >
              <Icon style={{ width: 26, height: 26, color: "#eab308" }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#eab308", fontWeight: 600 }}>
              {subtitle}
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: "4px 0 0", color: "#fafafa", letterSpacing: "-0.02em" }}>
              {title}
            </h1>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: 17, lineHeight: 1.6, color: "#d4d4d4", margin: "0 0 32px", maxWidth: 680 }}>
          {description}
        </p>

        {/* Optional inline preview content (seeded) */}
        {children && (
          <div style={{ marginBottom: 32 }}>
            {children}
          </div>
        )}

        {/* Walkthrough CTA */}
        <div
          style={{
            padding: "32px 28px",
            background: "linear-gradient(180deg, rgba(234,179,8,0.05) 0%, rgba(234,179,8,0.02) 100%)",
            border: "1px solid rgba(234,179,8,0.25)",
            borderRadius: 16,
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fafafa", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
            Want to see this module live?
          </h2>
          <p style={{ fontSize: 14, color: "#a3a3a3", margin: "0 0 20px", lineHeight: 1.55 }}>
            Book a 20-minute working session with Carlo and see it running against your venue's playbook.
          </p>
          <button
            onClick={handleCTAClick}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              minHeight: 56,
              padding: "16px 28px",
              background: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
              color: "#0a0a0b",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              boxShadow: "0 10px 28px rgba(234,179,8,0.35)",
              touchAction: "manipulation",
            }}
          >
            <Calendar style={{ width: 16, height: 16, pointerEvents: "none" }} />
            <span style={{ pointerEvents: "none" }}>Request Live Walkthrough</span>
          </button>
        </div>

        {/* Phase indicator */}
        <p style={{ marginTop: 28, fontSize: 12, color: "#737373", textAlign: "center", letterSpacing: "0.08em" }}>
          Full module available in Phase 2 deployment.
        </p>
      </div>

      <WalkthroughRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        referralSource={referralSource}
      />
    </DemoShell>
  );
}