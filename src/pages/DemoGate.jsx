/**
 * DemoGate — /demo/gate
 * Email-capture layer gating /demo/command-center.
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import DemoShell from "@/components/demo/DemoShell";
import { generateToken, startSession, getDeviceFingerprint } from "@/lib/demoSession";
import { Loader2, ArrowRight, Shield } from "lucide-react";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Admin override — these signed-in users bypass the demo gate entirely.
const OVERRIDE_EMAILS = ["carloearl@glyphlock.com", "carloearl@gmail.com", "santo@glyphlock.com"];
const OVERRIDE_NAME_KEYWORDS = ["carlo earl", "santo"];

export default function DemoGate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", venue_name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [checkingOverride, setCheckingOverride] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        const email = (me?.email || "").toLowerCase();
        const name = (me?.full_name || "").toLowerCase();
        const isOverride =
          OVERRIDE_EMAILS.includes(email) ||
          OVERRIDE_NAME_KEYWORDS.some((kw) => name.includes(kw));
        if (isOverride) {
          startSession({ token: generateToken(), leadId: `override_${me.id}` });
          navigate("/demo/command-center", { replace: true });
          return;
        }
      } catch (_) { /* not signed in — show gate */ }
      setCheckingOverride(false);
    })();
  }, [navigate]);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.full_name.trim() || !form.venue_name.trim()) {
      setError("Please complete all fields.");
      return;
    }
    if (!EMAIL_RX.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const token = generateToken();
      const res = await base44.functions.invoke("demoLeadSubmit", {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        venue_name: form.venue_name.trim(),
        session_token: token,
        user_agent: navigator.userAgent,
      });
      const data = res?.data || res;
      if (!data?.lead_id) throw new Error(data?.error || "Submission failed");
      startSession({ token: data.session_token, leadId: data.lead_id });

      // Fire-and-forget audit of gate submission
      try {
        await base44.functions.invoke("demoLogAction", {
          lead_id: data.lead_id,
          action: "demo_gate_submit",
          source_route: "/demo/gate",
          device_fingerprint: getDeviceFingerprint(),
        });
      } catch (_) { /* non-blocking */ }

      navigate("/demo/command-center", { replace: true });
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (checkingOverride) {
    return (
      <DemoShell gateMode>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 50px)" }}>
          <Loader2 style={{ width: 28, height: 28, color: "#eab308", animation: "spin 1s linear infinite" }} />
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </DemoShell>
    );
  }

  return (
    <DemoShell gateMode>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 50px)", padding: "48px 20px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(234,179,8,0.18)",
            borderRadius: 16,
            padding: "40px 32px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(234,179,8,0.05)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h1 style={{ fontSize: 30, fontWeight: 700, margin: 0, letterSpacing: "-0.01em", color: "#fafafa" }}>
              See NUPS Running Live
            </h1>
            <p style={{ fontSize: 15, color: "#a3a3a3", marginTop: 12, lineHeight: 1.55 }}>
              Enter your details to experience the system currently operating at Dream Palace.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Full Name" value={form.full_name} onChange={update("full_name")} autoComplete="name" required />
            <Field label="Email Address" type="email" value={form.email} onChange={update("email")} autoComplete="email" required />
            <Field label="Venue Name" value={form.venue_name} onChange={update("venue_name")} autoComplete="organization" required />

            {error && (
              <div style={{ color: "#fca5a5", fontSize: 13, padding: "8px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 8,
                minHeight: 56,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "16px 24px",
                background: submitting
                  ? "rgba(234,179,8,0.3)"
                  : "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
                color: "#0a0a0b",
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: "0.05em",
                border: "none",
                borderRadius: 12,
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: submitting ? "none" : "0 8px 24px rgba(234,179,8,0.35)",
                transition: "all 0.2s",
                touchAction: "manipulation",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                  <span>Launching…</span>
                </>
              ) : (
                <>
                  <span>Launch Demo</span>
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </button>

            <p style={{ fontSize: 12, color: "#737373", textAlign: "center", marginTop: 12, lineHeight: 1.55 }}>
              <Shield style={{ width: 12, height: 12, display: "inline-block", marginRight: 4, verticalAlign: "middle" }} />
              We use your info to follow up about NUPS. We do not share it.
            </p>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </DemoShell>
  );
}

function Field({ label, ...props }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#a3a3a3" }}>
        {label}
      </span>
      <input
        {...props}
        style={{
          minHeight: 48,
          padding: "12px 14px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fafafa",
          fontSize: 15,
          outline: "none",
          transition: "border-color 0.2s, background 0.2s",
          fontFamily: "inherit",
        }}
        onFocus={(e) => { e.target.style.borderColor = "rgba(234,179,8,0.5)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.04)"; }}
      />
    </label>
  );
}