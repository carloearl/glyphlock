/**
 * DemoShell — Wraps every /demo/* route with:
 *  - Session guard (redirects to /demo/gate if invalid/expired)
 *  - DemoModeBanner
 *  - Idle-touch handler
 *  - Dark-luxury background
 *
 * GateMode prop (optional): when true, skips the session guard — used ONLY on /demo/gate itself.
 */
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DemoModeBanner from "@/components/demo/DemoModeBanner";
import { isSessionValid, touchSession } from "@/lib/demoSession";

export default function DemoShell({ children, gateMode = false }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (gateMode) return;
    if (!isSessionValid()) {
      navigate("/demo/gate", { replace: true });
      return;
    }
    const onActivity = () => touchSession();
    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity);
    const interval = setInterval(() => {
      if (!isSessionValid()) navigate("/demo/gate", { replace: true });
    }, 30000);
    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      clearInterval(interval);
    };
  }, [gateMode, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(30,64,175,0.12) 0%, transparent 60%), linear-gradient(180deg, #0a0a0b 0%, #07080a 100%)",
        color: "#f5f5f5",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <DemoModeBanner />
      {children}
    </div>
  );
}