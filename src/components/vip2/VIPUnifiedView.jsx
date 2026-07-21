import React from "react";
import { DoorOpen, LayoutDashboard, Users, FileSignature } from "lucide-react";
import VIPLiveBoard from "@/components/vip2/VIPLiveBoard";
import ContractDesk from "@/components/vip2/ContractDesk";
import PeoplePanel from "@/components/vip2/PeoplePanel";
import UltimateVIPContract from "@/components/nups/vip/UltimateVIPContract";

/**
 * VIPUnifiedView — the single "everything about a VIP in one place" surface.
 * Stacks the existing Floor, Active Sessions, People (staff) and Contract
 * panels into one scrollable view so nothing has to be opened one-at-a-time.
 * Reuses the existing panels verbatim — no business logic is duplicated.
 */
function Section({ icon: Icon, title, subtitle, accent, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
      <header className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-white/[0.02]">
        <Icon className={`w-5 h-5 ${accent}`} />
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight leading-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function VIPUnifiedView({ state, refresh, canEdit }) {
  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <Section icon={DoorOpen} title="Rooms & Floor" subtitle="Live room timers — tap a room card to edit timing & status" accent="text-purple-300">
        <VIPLiveBoard />
      </Section>

      <Section icon={LayoutDashboard} title="Active Sessions" subtitle="Live VIP contracts & session control on the floor" accent="text-indigo-300">
        <ContractDesk state={state} refresh={refresh} />
      </Section>

      <Section icon={Users} title="People — Guests & Entertainers" subtitle="The VIP staff surface" accent="text-emerald-300">
        <PeoplePanel state={state} refresh={refresh} />
      </Section>

      <Section icon={FileSignature} title="VIP Contracts" subtitle="The editable contract, sell-&-seal desk, and sealed-record search" accent="text-amber-300">
        <UltimateVIPContract canEdit={canEdit} />
      </Section>
    </div>
  );
}