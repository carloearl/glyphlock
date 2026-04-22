/**
 * WalkthroughRequestModal — Secondary lead-capture modal used by every preview page.
 * Submits a new DemoLead via demoRequestWalkthrough backend function with referral_source.
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { getSession } from "@/lib/demoSession";
import { X, Loader2, Check } from "lucide-react";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function WalkthroughRequestModal({ open, onClose, referralSource }) {
  const [form, setForm] = useState({ full_name: "", email: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.full_name.trim()) return setError("Please enter your full name.");
    if (!EMAIL_RX.test(form.email.trim())) return setError("Please enter a valid email address.");
    setSubmitting(true);
    try {
      const session = getSession();
      const res = await base44.functions.invoke("demoRequestWalkthrough", {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        note: form.note.trim(),
        referral_source: referralSource,
        session_token: session?.token || null,
        parent_lead_id: session?.leadId || null,
      });
      const data = res?.data || res;
      if (!data?.lead_id) throw new Error(data?.error || "Submission failed");
      setSuccess(true);
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm({ full_name: "", email: "", note: "" });
    setError(null);
    setSuccess(false);
    setSubmitting(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Request Live Walkthrough"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "linear-gradient(180deg, #111113 0%, #0a0a0b 100%)",
          border: "1px solid rgba(234,179,8,0.25)",
          borderRadius: 16,
          padding: "32px 28px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(234,179,8,0.1)",
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            color: "#a3a3a3",
            cursor: "pointer",
            touchAction: "manipulation",
          }}
        >
          <X style={{ width: 16, height: 16, pointerEvents: "none" }} />
        </button>

        {success ? (
          <div style={{ textAlign: "center", padding: "16px 8px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Check style={{ width: 24, height: 24, color: "#22c55e" }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fafafa", margin: "0 0 8px" }}>
              Request received
            </h2>
            <p style={{ fontSize: 14, color: "#a3a3a3", margin: "0 0 24px", lineHeight: 1.55 }}>
              Check your inbox — Carlo will follow up within one business day to schedule your working session.
            </p>
            <button
              onClick={handleClose}
              style={{
                minHeight: 48,
                padding: "12px 24px",
                background: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
                color: "#0a0a0b",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.05em",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                touchAction: "manipulation",
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#eab308", fontWeight: 600, marginBottom: 8 }}>
              Live Walkthrough
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fafafa", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
              Request a working session
            </h2>
            <p style={{ fontSize: 13, color: "#a3a3a3", margin: "0 0 20px", lineHeight: 1.55 }}>
              We'll reach out within one business day to walk you through this module live.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Full Name" value={form.full_name} onChange={update("full_name")} autoComplete="name" required />
              <Field label="Email Address" type="email" value={form.email} onChange={update("email")} autoComplete="email" required />
              <Field label="Note (optional)" as="textarea" value={form.note} onChange={update("note")} rows={3} />

              {error && (
                <div style={{ color: "#fca5a5", fontSize: 12, padding: "8px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: 6,
                  minHeight: 52,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "14px 20px",
                  background: submitting ? "rgba(234,179,8,0.3)" : "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
                  color: "#0a0a0b",
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: "0.05em",
                  border: "none",
                  borderRadius: 10,
                  cursor: submitting ? "not-allowed" : "pointer",
                  boxShadow: submitting ? "none" : "0 6px 18px rgba(234,179,8,0.3)",
                  touchAction: "manipulation",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <span>Request Walkthrough</span>
                )}
              </button>
            </form>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Field({ label, as = "input", ...props }) {
  const Element = as === "textarea" ? "textarea" : "input";
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#a3a3a3", fontWeight: 600 }}>
        {label}
      </span>
      <Element
        {...props}
        style={{
          minHeight: as === "textarea" ? 72 : 44,
          padding: "10px 12px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fafafa",
          fontSize: 14,
          outline: "none",
          fontFamily: "inherit",
          resize: as === "textarea" ? "vertical" : "none",
        }}
        onFocus={(e) => { e.target.style.borderColor = "rgba(234,179,8,0.5)"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
      />
    </label>
  );
}