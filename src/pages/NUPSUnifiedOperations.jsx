import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, BadgeCheck, Building2, ClipboardCheck, DoorOpen, FileCheck2,
  MonitorDown, ShieldCheck, ShoppingCart, Truck, Users, WalletCards,
} from "lucide-react";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { useNUPSOperatingMode } from "@/hooks/useNUPSOperatingMode";

const FLOW = [
  {
    step: "01",
    title: "Open the venue",
    detail: "Start with identity review and guest check-in. Keep the station’s age and ID rules tied to the active venue.",
    icon: DoorOpen,
    action: "Open Front Door",
    to: "/FrontDoor",
    group: "NUPS operations",
  },
  {
    step: "02",
    title: "Record the sale",
    detail: "Continue to the venue register and preserve the cash, card, tip, and transaction boundaries.",
    icon: ShoppingCart,
    action: "Open Register",
    to: "/Register",
    group: "NUPS operations",
  },
  {
    step: "03",
    title: "Capture the agreement",
    detail: "Use the NUPS contract workspace for current venue work. DCE’s signed evidence workflow remains available while its records are brought into NUPS.",
    icon: FileCheck2,
    action: "Open NUPS Contracts",
    to: "/Contracts",
    group: "Evidence workflow",
  },
  {
    step: "04",
    title: "Track the floor",
    detail: "Keep VIP activity, entertainer attendance, staff work, and driver attribution connected to the shift.",
    icon: Users,
    action: "Open VIP Center",
    to: "/VIPCommand",
    group: "NUPS operations",
  },
  {
    step: "05",
    title: "Close the shift",
    detail: "Review payouts and reconcile the shift using the authorized manager or owner workspace.",
    icon: ClipboardCheck,
    action: "Open Manager Console",
    to: "/ManagerConsole",
    group: "NUPS operations",
  },
];

function FlowCard({ item, onOpen }) {
  const Icon = item.icon;
  return (
    <article className="unified-flow-card">
      <div className="unified-flow-number">{item.step}</div>
      <div className="unified-flow-icon"><Icon size={19} /></div>
      <div className="unified-flow-copy">
        <div className="unified-flow-label">{item.group}</div>
        <h3>{item.title}</h3>
        <p>{item.detail}</p>
      </div>
      <button type="button" onClick={() => onOpen(item.to)} className="unified-flow-action">
        {item.action}<ArrowRight size={16} />
      </button>
    </article>
  );
}

export default function NUPSUnifiedOperations() {
  const navigate = useNavigate();
  const venue = useActiveVenue();
  const mode = useNUPSOperatingMode(venue?.id || venue?.venue_id);

  return (
    <NUPSAppShell>
      <main className="unified-ops">
        <style>{`
          .unified-ops { min-height: 100vh; padding: clamp(1rem, 2.2vw, 2rem); color: #eff5ff; background: radial-gradient(ellipse at 78% 0%, rgba(31, 114, 181, .16), transparent 34%), #070b18; }
          .unified-ops * { box-sizing: border-box; }
          .unified-ops-inner { max-width: 1320px; margin: 0 auto; }
          .unified-ops-kicker { display: flex; gap: .55rem; align-items: center; color: #68e3f2; font-size: .7rem; font-weight: 850; letter-spacing: .16em; text-transform: uppercase; }
          .unified-ops-hero { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1.25rem; }
          .unified-ops-hero h1 { margin: .5rem 0 .45rem; font-size: clamp(1.85rem, 3.4vw, 3rem); letter-spacing: -.045em; line-height: 1.03; }
          .unified-ops-hero p { max-width: 720px; margin: 0; color: #9eabc4; font-size: .95rem; line-height: 1.55; }
          .unified-mode { flex: none; display: flex; flex-direction: column; gap: .35rem; padding: .75rem .9rem; border: 1px solid rgba(120, 155, 212, .2); border-radius: 13px; background: rgba(10, 18, 39, .78); }
          .unified-mode small { color: #8794ad; font-size: .64rem; letter-spacing: .1em; text-transform: uppercase; }
          .unified-mode strong { color: #d9e7ff; font-size: .85rem; }
          .unified-core-banner { display: grid; grid-template-columns: auto 1fr auto; gap: 1rem; align-items: center; margin: 1.2rem 0 1.5rem; padding: 1rem 1.1rem; border: 1px solid rgba(70, 196, 216, .26); border-radius: 16px; background: linear-gradient(100deg, rgba(9, 47, 66, .82), rgba(12, 21, 44, .78)); }
          .unified-core-icon { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 13px; color: #04202b; background: linear-gradient(135deg, #72edf3, #4db2f0); }
          .unified-core-banner strong { display: block; margin-bottom: .18rem; color: #eaf9ff; font-size: .9rem; }
          .unified-core-banner p { margin: 0; color: #a8bfd3; font-size: .8rem; line-height: 1.5; }
          .unified-core-state { color: #7be2bb; font-size: .69rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; }
          .unified-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(280px, .85fr); gap: 1rem; align-items: start; }
          .unified-panel { min-width: 0; padding: 1rem; border: 1px solid rgba(130, 154, 196, .16); border-radius: 17px; background: rgba(11, 17, 36, .84); }
          .unified-panel-head { display: flex; justify-content: space-between; gap: .75rem; align-items: center; margin-bottom: .8rem; }
          .unified-panel-head h2 { margin: 0; font-size: 1.02rem; letter-spacing: -.02em; }
          .unified-panel-head span { color: #7f8da7; font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
          .unified-flow-list { display: grid; gap: .65rem; }
          .unified-flow-card { display: grid; grid-template-columns: 34px 40px minmax(0,1fr) auto; gap: .8rem; align-items: center; padding: .85rem; border: 1px solid rgba(130, 154, 196, .13); border-radius: 14px; background: rgba(7, 12, 27, .8); }
          .unified-flow-number { color: #75839c; font-size: .72rem; font-weight: 800; font-variant-numeric: tabular-nums; }
          .unified-flow-icon { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 12px; color: #72e7f2; background: rgba(37, 190, 213, .1); }
          .unified-flow-copy { min-width: 0; }
          .unified-flow-label { margin-bottom: .15rem; color: #83dce9; font-size: .61rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
          .unified-flow-copy h3 { margin: 0 0 .2rem; color: #f2f6ff; font-size: .9rem; }
          .unified-flow-copy p { margin: 0; color: #95a1b8; font-size: .75rem; line-height: 1.45; }
          .unified-flow-action { display: inline-flex; min-height: 38px; gap: .45rem; align-items: center; justify-content: center; padding: .55rem .7rem; border: 1px solid rgba(114, 231, 242, .23); border-radius: 10px; color: #dffaff; background: rgba(26, 115, 137, .12); font: inherit; font-size: .72rem; font-weight: 750; white-space: nowrap; cursor: pointer; }
          .unified-flow-action:hover { border-color: rgba(114, 231, 242, .6); background: rgba(26, 115, 137, .22); }
          .unified-side-stack { display: grid; gap: 1rem; }
          .unified-system-card { padding: .9rem; border: 1px solid rgba(130, 154, 196, .14); border-radius: 14px; background: rgba(7, 12, 27, .72); }
          .unified-system-top { display: flex; gap: .6rem; align-items: center; margin-bottom: .55rem; }
          .unified-system-top svg { color: #75dfec; }
          .unified-system-top h3 { flex: 1; margin: 0; font-size: .84rem; }
          .unified-status { padding: .25rem .5rem; border-radius: 999px; color: #98a7c0; background: rgba(129, 147, 177, .1); font-size: .58rem; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
          .unified-system-card p { margin: 0 0 .75rem; color: #96a3bb; font-size: .75rem; line-height: 1.5; }
          .unified-system-link { display: inline-flex; gap: .4rem; align-items: center; color: #83e3ee; font-size: .72rem; font-weight: 750; text-decoration: none; }
          .unified-boundary { margin-top: 1rem; padding: .8rem .9rem; border-left: 2px solid #e5b65f; border-radius: 5px 12px 12px 5px; background: rgba(203, 146, 51, .08); color: #c0b392; font-size: .71rem; line-height: 1.55; }
          .unified-note { margin: 1rem 0 0; color: #71809b; font-size: .7rem; line-height: 1.5; }
          @media (max-width: 1020px) { .unified-grid { grid-template-columns: 1fr; } .unified-side-stack { grid-template-columns: repeat(2,minmax(0,1fr)); } }
          @media (max-width: 740px) { .unified-ops-hero { flex-direction: column; } .unified-mode { width: 100%; } .unified-core-banner { grid-template-columns: auto 1fr; } .unified-core-state { grid-column: 2; } .unified-flow-card { grid-template-columns: 28px 38px minmax(0,1fr); } .unified-flow-action { grid-column: 3; justify-self: start; } .unified-side-stack { grid-template-columns: 1fr; } }
        `}</style>
        <div className="unified-ops-inner">
          <header className="unified-ops-hero">
            <div>
              <div className="unified-ops-kicker"><Building2 size={14} /> NUPS · Unified Venue Operations</div>
              <h1>One shift. One connected system.</h1>
              <p>Run the venue from NUPS. The operating flow below brings door, register, agreements, floor, driver activity, and closeout into one guided workspace.</p>
            </div>
            <div className="unified-mode" aria-live="polite">
              <small>{venue?.name || "Active venue"}</small>
              <strong>{mode.loading ? "Loading mode…" : mode.error ? "Mode needs review" : `${mode.operatingMode} · ${mode.ledgerMode}`}</strong>
            </div>
          </header>

          <section className="unified-core-banner" aria-label="NUPS core system status">
            <div className="unified-core-icon"><ShieldCheck size={20} /></div>
            <div>
              <strong>NUPS is the system of record</strong>
              <p>Role-controlled operations, venue context, and REAL / DEMO / SANDBOX boundaries stay inside the NUPS runtime.</p>
            </div>
            <div className="unified-core-state">Core workspace</div>
          </section>

          <div className="unified-grid">
            <section className="unified-panel" aria-labelledby="unified-flow-heading">
              <div className="unified-panel-head">
                <h2 id="unified-flow-heading">Tonight’s operating flow</h2>
                <span>{venue?.name || "Venue selected"}</span>
              </div>
              <div className="unified-flow-list">
                {FLOW.map((item) => <FlowCard key={item.step} item={item} onOpen={navigate} />)}
              </div>
            </section>

            <aside className="unified-side-stack" aria-label="Connected systems">
              <section className="unified-panel">
                <div className="unified-panel-head">
                  <h2>System integration</h2>
                  <span>Current state</span>
                </div>

                <article className="unified-system-card">
                  <div className="unified-system-top"><Building2 size={18} /><h3>NUPS venue platform</h3><span className="unified-status">Core</span></div>
                  <p>Owner and manager views, front door, register, VIP, staff, drivers, accounting, and audit stay in the primary venue workspace.</p>
                  <button type="button" onClick={() => navigate("/NUPSHub")} className="unified-system-link">Open NUPS dashboard <ArrowRight size={14} /></button>
                </article>

                <article className="unified-system-card">
                  <div className="unified-system-top"><FileCheck2 size={18} /><h3>DCE evidence workflows</h3><span className="unified-status">Bridge in progress</span></div>
                  <p>Agreement state, processor references, attestations, and append-only evidence are being brought under NUPS. Existing DCE records remain in the DCE app during the transition.</p>
                  <a className="unified-system-link" href="https://dce.glyphlock.io" target="_blank" rel="noreferrer">Open current DCE <ArrowRight size={14} /></a>
                </article>

                <article className="unified-system-card">
                  <div className="unified-system-top"><MonitorDown size={18} /><h3>GlyphLock Door station</h3><span className="unified-status">Local station</span></div>
                  <p>Launches the installed Windows station on this computer. Its current package stores door records locally; cloud synchronization is not confirmed.</p>
                  <a className="unified-system-link" href="http://127.0.0.1:47831" target="_blank" rel="noreferrer">Open this PC’s Door station <ArrowRight size={14} /></a>
                </article>

                <div className="unified-boundary">
                  DCE and Door data are not yet being written into NUPS. This view keeps each source visible while the migration and station-sync path is completed.
                </div>
              </section>
            </aside>
          </div>

          <p className="unified-note">No DCE ledger rows or local Door records are copied, repriced, or combined from this screen. The source remains visible for each system.</p>
        </div>
      </main>
    </NUPSAppShell>
  );
}
