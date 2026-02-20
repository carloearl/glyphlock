import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Pricing() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(createPageUrl("Consultation"), { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white" style={{ background: 'transparent' }}>
      <p className="text-slate-400 text-sm">Redirecting to Protocol Verification...</p>
    </div>
  );
}