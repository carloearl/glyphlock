import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Shield, LogIn, CheckCircle2, FileSignature, Music, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Noindex
if (typeof document !== "undefined" && !document.querySelector('meta[data-nups]')) {
  const m = document.createElement("meta");
  m.name = "robots"; m.content = "noindex, nofollow"; m.setAttribute("data-nups", "1");
  document.head.appendChild(m);
}

const CLICKWRAP_TERMS = [
  "I understand this system contains confidential business information.",
  "I agree to the company's data privacy and security policies.",
  "I will not share my login credentials with unauthorized individuals.",
  "I acknowledge that all actions are logged and audited.",
  "I agree to the Independent Contractor Agreement terms (if applicable).",
  "I understand misuse of this system may result in termination and legal action."
];

const ROLES = [
  {
    key: "Admin",
    label: "Admin",
    sub: "Owner / Manager",
    icon: Shield,
    color: "from-violet-600/20 to-indigo-600/20",
    border: "border-violet-500/40 hover:border-violet-400",
    iconColor: "text-violet-400",
  },
  {
    key: "Staff",
    label: "Staff",
    sub: "POS · Time Clock",
    icon: LogIn,
    color: "from-cyan-600/20 to-blue-600/20",
    border: "border-cyan-500/40 hover:border-cyan-400",
    iconColor: "text-cyan-400",
  },
  {
    key: "Entertainer",
    label: "Entertainer",
    sub: "Check-In · Floor",
    icon: Music,
    color: "from-pink-600/20 to-rose-600/20",
    border: "border-pink-500/40 hover:border-pink-400",
    iconColor: "text-pink-400",
  },
];

// Step 1: Role selection
function RoleStep({ onSelect }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-white/70 text-sm">Who are you signing in as?</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {ROLES.map((role) => {
          const Icon = role.icon;
          return (
            <button
              key={role.key}
              onClick={() => onSelect(role.key)}
              className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${role.color} border ${role.border} transition-all duration-200 active:scale-[0.98] text-left group`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-black/30 ${role.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-white font-bold">{role.label}</div>
                <div className="text-white/50 text-xs">{role.sub}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Step 2: Clickwrap agreement
function AgreementStep({ roleKey, onBack, onAgree }) {
  const [acks, setAcks] = useState(CLICKWRAP_TERMS.map(() => false));
  const allAcked = acks.every(Boolean);

  const toggle = (i) => setAcks(p => { const n = [...p]; n[i] = !n[i]; return n; });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileSignature className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <h3 className="text-sm font-bold text-amber-400">
          {roleKey} Agreement — Read & Acknowledge
        </h3>
      </div>

      <div className="bg-black/50 border border-gray-700 rounded-lg p-3 max-h-56 overflow-y-auto space-y-3">
        {CLICKWRAP_TERMS.map((term, i) => (
          <div
            key={i}
            className="flex items-start gap-3 cursor-pointer"
            onClick={() => toggle(i)}
          >
            <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${acks[i] ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
              {acks[i] && <CheckCircle2 className="w-3 h-3 text-white" />}
            </div>
            <p className="text-[12px] text-gray-300 leading-relaxed select-none">{term}</p>
          </div>
        ))}
      </div>

      <Button
        onClick={onAgree}
        disabled={!allAcked}
        className="w-full h-12 bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] hover:from-[#6D28D9] hover:to-[#2563EB] rounded-xl disabled:opacity-40 font-bold"
      >
        <LogIn className="w-4 h-4 mr-2" />
        I Agree — Continue to Sign In
      </Button>

      <button
        onClick={onBack}
        className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
      >
        ← Back to role selection
      </button>
    </div>
  );
}

// Step 3: Redirect to sign in
function SignInStep({ roleKey }) {
  const handleSignIn = () => {
    sessionStorage.setItem("nups_role_hint", roleKey);
    base44.auth.redirectToLogin(createPageUrl("NUPSPostLogin"));
  };

  return (
    <div className="space-y-5 text-center">
      <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-7 h-7 text-green-400" />
      </div>
      <div>
        <p className="text-white font-bold">Agreement accepted</p>
        <p className="text-white/50 text-sm mt-1">
          Signing in as <span className="text-white/80 font-semibold">{roleKey}</span>
        </p>
      </div>
      <Button
        onClick={handleSignIn}
        className="w-full h-12 bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] hover:from-[#6D28D9] hover:to-[#2563EB] rounded-xl font-bold"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Sign In to N.U.P.S.
      </Button>
    </div>
  );
}

// Step labels
const STEPS = ["role", "agreement", "signin"];

export default function NUPSLogin() {
  const [step, setStep] = useState("role");
  const [selectedRole, setSelectedRole] = useState(null);

  const handleSelectRole = (roleKey) => {
    setSelectedRole(roleKey);
    setStep("agreement");
  };

  const handleAgree = () => {
    setStep("signin");
  };

  const handleBack = () => {
    setStep("role");
    setSelectedRole(null);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF]/20 via-[#7C3AED]/10 to-[#3B82F6]/20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(124,58,237,0.5)]">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black">
            <span className="bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] bg-clip-text text-transparent">N.U.P.S.</span>{" "}
            <span className="text-white">POS</span>
          </h1>
          <p className="text-white/50 mt-1 text-sm">Nexus Universal Point-of-Sale</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors ${step === s ? 'bg-violet-400' : STEPS.indexOf(step) > i ? 'bg-green-500' : 'bg-white/20'}`} />
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(124,58,237,0.3)]">
          {step === "role" && <RoleStep onSelect={handleSelectRole} />}
          {step === "agreement" && (
            <AgreementStep
              roleKey={selectedRole}
              onBack={handleBack}
              onAgree={handleAgree}
            />
          )}
          {step === "signin" && <SignInStep roleKey={selectedRole} />}
        </div>
      </div>
    </div>
  );
}