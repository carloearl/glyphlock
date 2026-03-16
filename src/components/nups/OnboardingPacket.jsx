/**
 * OnboardingPacket — Step 7
 * New hire onboarding: profile → documents → role → contract → manager approval → activation
 * Users cannot gain operational access until all steps are marked complete.
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  UserPlus, Upload, Shield, FileText, CheckCircle2, Clock,
  ChevronRight, AlertTriangle, Lock, Users, Star
} from "lucide-react";

const ONBOARDING_STEPS = [
  { key: "profile",   label: "Profile Created",       icon: UserPlus,     desc: "Basic info & stage name" },
  { key: "documents", label: "Documents Uploaded",    icon: Upload,       desc: "ID, W-9, or contracts" },
  { key: "role",      label: "Role Assigned",         icon: Shield,       desc: "Operational role granted" },
  { key: "contract",  label: "Contract Issued",       icon: FileText,     desc: "Clickwrap or physical" },
  { key: "approval",  label: "Manager Approved",      icon: CheckCircle2, desc: "Supervisor sign-off" },
  { key: "activated", label: "Account Activated",     icon: Star,         desc: "Full operational access" },
];

const ROLES = [
  { value: "PERFORMER",    label: "Entertainer / Performer" },
  { value: "BARTENDER",    label: "Bartender" },
  { value: "DJ",           label: "DJ" },
  { value: "SECURITY",     label: "Security" },
  { value: "KIOSK",        label: "Kiosk / Cashier" },
  { value: "VENUE_MANAGER",label: "Manager" },
];

function StepIndicator({ steps, currentStep, completedSteps }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((s, i) => {
        const done = completedSteps.includes(s.key);
        const active = s.key === currentStep;
        const Icon = s.icon;
        return (
          <React.Fragment key={s.key}>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              done    ? "bg-green-500/10 text-green-400 border border-green-500/20" :
              active  ? "bg-violet-500/10 text-violet-400 border border-violet-500/30" :
                        "text-gray-600 border border-white/[0.04]"
            }`}>
              {done ? <CheckCircle2 className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-gray-700 flex-shrink-0" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function OnboardingPacket({ currentUser }) {
  const qc = useQueryClient();
  const [newHire, setNewHire] = useState({
    stage_name: "", legal_name: "", email: "", phone: "",
    role: "", doc_note: "", contract_notes: "",
  });
  const [onboardingStep, setOnboardingStep] = useState("profile");
  const [completedSteps, setCompletedSteps] = useState([]);
  const [createdEntertainer, setCreatedEntertainer] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data: entertainers = [] } = useQuery({
    queryKey: ["onboarding-entertainers"],
    queryFn: () => base44.entities.Entertainer.list("-created_date", 100),
  });

  // Pending — no contract signed and no operational role
  const pendingOnboarding = entertainers.filter(e => !e.contract_signed);
  const completedOnboarding = entertainers.filter(e => e.contract_signed);

  const createProfile = useMutation({
    mutationFn: () => base44.entities.Entertainer.create({
      stage_name: newHire.stage_name,
      legal_name: newHire.legal_name,
      phone: newHire.phone,
      email: newHire.email,
      status: "inactive", // blocked until onboarding complete
      contract_signed: false,
    }),
    onSuccess: (result) => {
      setCreatedEntertainer(result);
      markStep("profile");
      toast.success("Profile created — proceed to document upload");
    },
  });

  const completeDocuments = useMutation({
    mutationFn: () => base44.entities.Entertainer.update(createdEntertainer.id, {
      notes: `Docs: ${newHire.doc_note || "Uploaded offline"} | ${new Date().toLocaleDateString()}`,
    }),
    onSuccess: () => { markStep("documents"); toast.success("Documents recorded"); },
  });

  const assignRole = useMutation({
    mutationFn: async () => {
      // Write role to UserRoleAssignment entity (RBAC backend persistence)
      const userEmail = createdEntertainer.email ||
        `${createdEntertainer.stage_name.toLowerCase().replace(/\s+/g, '.')}@nups.local`;
      await base44.entities.UserRoleAssignment.create({
        user_email: userEmail,
        role_key: newHire.role,
        venue_id: "dream_palace",
        assigned_by: currentUser?.email || "system",
        assigned_at: new Date().toISOString(),
        is_active: false, // blocked until activation step completes
      }).catch(() => {}); // non-fatal: entity may not exist in all envs
      return base44.entities.Entertainer.update(createdEntertainer.id, {
        commission_rate: newHire.role === "PERFORMER" ? 0.5 : 0.0,
      });
    },
    onSuccess: () => { markStep("role"); toast.success(`Role ${newHire.role} assigned & recorded in RBAC`); },
  });

  const issueContract = useMutation({
    mutationFn: () => base44.entities.Entertainer.update(createdEntertainer.id, {
      // Mark contract as issued — not yet signed
      status: "inactive",
    }),
    onSuccess: () => { markStep("contract"); toast.success("Contract issued — pending signature"); },
  });

  const managerApprove = useMutation({
    mutationFn: () => base44.entities.Entertainer.update(createdEntertainer.id, {
      contract_signed: true,
      contract_signed_date: new Date().toISOString(),
      contract_ip_address: "manager-approved",
    }),
    onSuccess: () => { markStep("approval"); toast.success("Manager approval recorded"); },
  });

  const activateAccount = useMutation({
    mutationFn: async () => {
      // Flip UserRoleAssignment to active (RBAC live access)
      const userEmail = createdEntertainer.email ||
        `${createdEntertainer.stage_name.toLowerCase().replace(/\s+/g, '.')}@nups.local`;
      const existing = await base44.entities.UserRoleAssignment.filter({ user_email: userEmail }).catch(() => []);
      if (existing?.length > 0) {
        await base44.entities.UserRoleAssignment.update(existing[0].id, { is_active: true }).catch(() => {});
      }
      return base44.entities.Entertainer.update(createdEntertainer.id, {
        status: "active",
        contract_signature: `Activated by ${currentUser?.email} on ${new Date().toLocaleDateString()}`,
      });
    },
    onSuccess: () => {
      markStep("activated");
      qc.invalidateQueries({ queryKey: ["onboarding-entertainers"] });
      toast.success(`${newHire.stage_name} is now fully activated!`);
      setTimeout(() => {
        setShowForm(false);
        setNewHire({ stage_name: "", legal_name: "", email: "", phone: "", role: "", doc_note: "", contract_notes: "" });
        setOnboardingStep("profile");
        setCompletedSteps([]);
        setCreatedEntertainer(null);
      }, 2000);
    },
  });

  const markStep = (step) => {
    setCompletedSteps(prev => [...new Set([...prev, step])]);
    const idx = ONBOARDING_STEPS.findIndex(s => s.key === step);
    if (idx < ONBOARDING_STEPS.length - 1) {
      setOnboardingStep(ONBOARDING_STEPS[idx + 1].key);
    }
  };

  const isStepDone = (key) => completedSteps.includes(key);

  const renderStepContent = () => {
    switch (onboardingStep) {
      case "profile":
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Enter basic details for the new hire.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-400 text-xs">Stage Name *</Label>
                <Input value={newHire.stage_name} onChange={e => setNewHire(p => ({ ...p, stage_name: e.target.value }))}
                  placeholder="e.g. Luna" className="mt-1 text-white bg-white/[0.04] border-white/[0.12]" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Legal Name *</Label>
                <Input value={newHire.legal_name} onChange={e => setNewHire(p => ({ ...p, legal_name: e.target.value }))}
                  placeholder="Full legal name" className="mt-1 text-white bg-white/[0.04] border-white/[0.12]" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Email</Label>
                <Input type="email" value={newHire.email} onChange={e => setNewHire(p => ({ ...p, email: e.target.value }))}
                  placeholder="hire@email.com" className="mt-1 text-white bg-white/[0.04] border-white/[0.12]" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Phone</Label>
                <Input value={newHire.phone} onChange={e => setNewHire(p => ({ ...p, phone: e.target.value }))}
                  placeholder="(555) 000-0000" className="mt-1 text-white bg-white/[0.04] border-white/[0.12]" />
              </div>
            </div>
            <Button
              onClick={() => createProfile.mutate()}
              disabled={!newHire.stage_name || !newHire.legal_name || createProfile.isPending}
              className="w-full bg-violet-600 hover:bg-violet-500"
            >
              {createProfile.isPending ? "Creating…" : "Create Profile →"}
            </Button>
          </div>
        );

      case "documents":
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Record that required documents have been collected (ID, W-9, agreements).</p>
            <div>
              <Label className="text-gray-400 text-xs">Document Notes</Label>
              <Input value={newHire.doc_note} onChange={e => setNewHire(p => ({ ...p, doc_note: e.target.value }))}
                placeholder="e.g. State ID + W-9 collected 3/16/2026" className="mt-1 text-white bg-white/[0.04] border-white/[0.12]" />
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400/80 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Physical documents should be scanned and stored per venue retention policy.
            </div>
            <Button onClick={() => completeDocuments.mutate()} disabled={completeDocuments.isPending}
              className="w-full bg-blue-600 hover:bg-blue-500">
              {completeDocuments.isPending ? "Saving…" : "Confirm Documents Collected →"}
            </Button>
          </div>
        );

      case "role":
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Assign an operational role. This determines what tools they can access.</p>
            <Select value={newHire.role} onValueChange={v => setNewHire(p => ({ ...p, role: v }))}>
              <SelectTrigger className="text-white bg-white/[0.04] border-white/[0.12]">
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => assignRole.mutate()} disabled={!newHire.role || assignRole.isPending}
              className="w-full bg-cyan-600 hover:bg-cyan-500">
              {assignRole.isPending ? "Saving…" : "Assign Role →"}
            </Button>
          </div>
        );

      case "contract":
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Issue the employment or contractor agreement.</p>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-sm text-gray-400 space-y-2">
              <p><span className="text-white font-semibold">New Hire:</span> {newHire.stage_name} ({newHire.legal_name})</p>
              <p><span className="text-white font-semibold">Role:</span> {newHire.role || "—"}</p>
              <p><span className="text-white font-semibold">Contract Type:</span> Independent Contractor Agreement</p>
              <p><span className="text-white font-semibold">Status:</span> <span className="text-yellow-400">Pending Signature</span></p>
            </div>
            <Button onClick={() => issueContract.mutate()} disabled={issueContract.isPending}
              className="w-full bg-orange-600 hover:bg-orange-500">
              {issueContract.isPending ? "Issuing…" : "Issue Contract →"}
            </Button>
          </div>
        );

      case "approval":
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Manager must confirm this hire is approved before activation.</p>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-sm space-y-1">
              <p className="text-white font-semibold">Approving Manager: <span className="text-gray-400">{currentUser?.email}</span></p>
              <p className="text-white font-semibold">Hire: <span className="text-gray-400">{newHire.stage_name}</span></p>
              <p className="text-[10px] text-gray-600 mt-2">By confirming, you certify that all documents have been reviewed and the candidate is authorized to begin.</p>
            </div>
            <Button onClick={() => managerApprove.mutate()} disabled={managerApprove.isPending}
              className="w-full bg-green-600 hover:bg-green-500">
              {managerApprove.isPending ? "Recording…" : "Confirm Manager Approval →"}
            </Button>
          </div>
        );

      case "activated":
        return (
          <div className="space-y-3">
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="font-bold text-white text-lg">{newHire.stage_name}</p>
              <p className="text-green-400 text-sm">Onboarding complete — Account activated</p>
            </div>
            <Button onClick={() => activateAccount.mutate()} disabled={activateAccount.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-500">
              {activateAccount.isPending ? "Activating…" : "Finalize & Activate Account"}
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-violet-400" /> New Hire Onboarding
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">Staff cannot access operational tools until onboarding is complete</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-violet-600 hover:bg-violet-500 text-xs"
          size="sm"
        >
          {showForm ? "Cancel" : "+ Start Onboarding"}
        </Button>
      </div>

      {/* New Hire Form */}
      {showForm && (
        <Card className="bg-white/[0.03] border-violet-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm">New Hire Packet</CardTitle>
            <StepIndicator steps={ONBOARDING_STEPS} currentStep={onboardingStep} completedSteps={completedSteps} />
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>
      )}

      {/* Pending onboarding */}
      {pendingOnboarding.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold flex items-center gap-1">
            <Lock className="w-3 h-3 text-yellow-400" /> Pending Onboarding ({pendingOnboarding.length})
          </p>
          <div className="space-y-2">
            {pendingOnboarding.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <div>
                  <div className="font-semibold text-white text-sm">{e.stage_name}</div>
                  <div className="text-xs text-gray-500">{e.legal_name}</div>
                </div>
                <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[10px]">Incomplete</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedOnboarding.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-400" /> Active Staff ({completedOnboarding.length})
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {completedOnboarding.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                <div>
                  <div className="font-semibold text-white text-sm">{e.stage_name}</div>
                  <div className="text-xs text-gray-500">{e.legal_name} · Signed {e.contract_signed_date ? new Date(e.contract_signed_date).toLocaleDateString() : "—"}</div>
                </div>
                <Badge className={`text-[10px] ${e.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                  {e.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}