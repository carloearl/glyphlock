import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Building2, ClipboardCheck, DoorOpen, ExternalLink,
  FileCheck2, MonitorDown, Network, ShieldCheck, ShoppingCart, Users,
} from "lucide-react";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import RoleClassGuard from "@/components/nups/RoleClassGuard";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { useNUPSOperatingMode } from "@/hooks/useNUPSOperatingMode";

const OPERATIONAL_LINKS = [
  { n: "01", title: "Front Door", note: "Guest ID review, entry, driver drop-off, ring-up and attendance.", icon: DoorOpen, to: "/FrontDoor", action: "Open Front Door", tone: "cyan" },
  { n: "02", title: "Register", note: "Record venue sales in the active NUPS ledger.", icon: ShoppingCart, to: "/Register", action: "Open Register", tone: "green" },
  { n: "03", title: "VIP & Floor", note: "Room activity, VIP guests and live floor operations.", icon: Users, to: "/VIPCommand", action: "Open VIP Center", tone: "violet" },
  { n: "04", title: "Contracts", note: "Create and review current NUPS contract records.", icon: FileCheck2, to: "/Contracts", action: "Open Contracts", tone: "amber" },
  { n: "05", title: "Shift Close", note: "Manager workflow for staff, payouts and closeout review.", icon: ClipboardCheck, to: "/ManagerConsole", action: "Open Manager Console", tone: "pink" },
];

function LinkCard({ item, onOpen }) {
  const Icon = item.icon;
  return (
    <article className="unified-link-card">
      <span className="unified-step">{item.n}</span>
      <span className={`unified-icon ${item.tone}`}><Icon size={19} /></span>
      <div className="unified-copy">
        <h3>{item.title}</h3><p>{item.note}</p>
      </div>
      <button type="button" onClick={() => onOpen(item.to)} className="unified-button">{item.action}<ArrowRight size={15} /></button>
    </article>
  );
}

function UnifiedWorkspace() {
  const navigate = useNavigate();
  const venue = useActiveVenue();
  const mode = useNUPSOperatingMode(venue?.id || venue?.venue_id);

  return (
    <NUPSAppShell title="Unified Venue System" subtitle="NUPS command · DCE agreements · Door station">
      <main className="unified-venue">
        <style>{`
          .unified-venue{max-width:1440px;margin:0 auto;color:#f3f6ff}
          .unified-venue *{box-sizing:border-box}
          .uv-hero{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin:4px 0 22px}
          .uv-kicker{display:flex;align-items:center;gap:8px;color:#7ce7f0;font-size:11px;font-weight:850;letter-spacing:.15em;text-transform:uppercase}
          .uv-hero h1{font-size:clamp(28px,4vw,48px);line-height:1.02;letter-spacing:-.045em;margin:11px 0 10px}
          .uv-hero p{max-width:760px;margin:0;color:#9eabc2;font-size:14px;line-height:1.6}
          .uv-mode{min-width:210px;padding:13px 15px;border:1px solid #25314b;border-radius:14px;background:#0c1324}
          .uv-mode small{display:block;color:#8795b0;text-transform:uppercase;font-size:10px;letter-spacing:.12em;margin-bottom:5px}
          .uv-mode strong{font-size:13px;color:#e4edff}
          .uv-core{display:flex;align-items:center;gap:14px;margin:18px 0 22px;padding:16px;border:1px solid #155b6c;border-radius:16px;background:linear-gradient(100deg,#0b2833,#10182c 75%)}
          .uv-core-icon{display:grid;place-items:center;width:44px;height:44px;flex:none;border-radius:14px;background:linear-gradient(135deg,#62e7ed,#39a4db);color:#071622}
          .uv-core strong{display:block;font-size:14px;margin-bottom:3px}
          .uv-core p{margin:0;color:#9eb9cd;font-size:12px;line-height:1.5}
          .uv-state{margin-left:auto;color:#8be1c0;font-size:10px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
          .uv-layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.85fr);gap:16px;align-items:start}
          .uv-panel{padding:17px;border:1px solid #1d2940;border-radius:17px;background:rgba(10,16,32,.9)}
          .uv-panel-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:13px}
          .uv-panel-head h2{margin:0;font-size:16px;letter-spacing:-.02em}
          .uv-panel-head span{font-size:10px;color:#7888a6;letter-spacing:.09em;text-transform:uppercase}
          .uv-list{display:grid;gap:9px}
          .unified-link-card{display:grid;grid-template-columns:30px 40px minmax(0,1fr) auto;align-items:center;gap:12px;padding:12px;border:1px solid #1c2940;border-radius:14px;background:#090f1e}
          .unified-step{font-size:11px;font-weight:850;color:#71819c}
          .unified-icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px}
          .unified-icon.cyan{color:#72e8ee;background:#0b323b}.unified-icon.green{color:#77e2b0;background:#0c302a}.unified-icon.violet{color:#c2a4ff;background:#241b3a}.unified-icon.amber{color:#f0c36e;background:#332817}.unified-icon.pink{color:#ff9ec4;background:#351b2c}
          .unified-copy h3{margin:0 0 3px;font-size:13px}.unified-copy p{margin:0;color:#93a0b8;font-size:11px;line-height:1.45}
          .unified-button{min-height:36px;display:flex;align-items:center;justify-content:center;gap:7px;padding:0 11px;border:1px solid #2b4760;border-radius:10px;background:#0c1a2b;color:#dffbff;font:inherit;font-size:10px;font-weight:800;white-space:nowrap;cursor:pointer}
          .unified-button:hover{border-color:#53c9d5;background:#10303b}
          .uv-system-list{display:grid;gap:10px}
          .uv-system{padding:13px;border:1px solid #1d2940;border-radius:14px;background:#090f1e}
          .uv-system-title{display:flex;align-items:center;gap:9px;margin-bottom:7px}
          .uv-system-title h3{margin:0;flex:1;font-size:13px}
          .uv-system-title svg{color:#74dce8}
          .uv-badge{padding:4px 7px;border-radius:999px;background:#172337;color:#aebcd2;font-size:9px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
          .uv-system p{margin:0 0 10px;color:#94a1b7;font-size:11px;line-height:1.5}
          .uv-system a,.uv-system button{display:inline-flex;align-items:center;gap:6px;padding:0;border:0;background:none;color:#7fe3ed;font:inherit;font-size:10px;font-weight:850;text-decoration:none;cursor:pointer}
          .uv-system button:disabled{color:#8793a7;cursor:default}
          .uv-boundary{margin-top:12px;padding:11px 12px;border-left:2px solid #d6a544;border-radius:5px 11px 11px 5px;background:#201a10;color:#c8b98f;font-size:10px;line-height:1.55}
          .uv-footer{margin:13px 2px 0;color:#71809b;font-size:10px;line-height:1.5}
          @media(max-width:980px){.uv-layout{grid-template-columns:1fr}}
          @media(max-width:680px){.uv-hero{flex-direction:column}.uv-mode{width:100%}.uv-core{align-items:flex-start}.uv-state{display:none}.unified-link-card{grid-template-columns:24px 38px minmax(0,1fr)}.unified-button{grid-column:3;justify-self:start}.uv-panel{padding:13px}.uv-panel-head{align-items:flex-start;flex-direction:column}}
        `}</style>
        <header className="uv-hero">
          <div>
            <div className="uv-kicker"><Network size={14} /> NUPS · Three systems, one operating path</div>
            <h1>Run the venue from one place.</h1>
            <p>NUPS remains the enterprise venue platform. This workspace puts its live operating tools beside the DCE agreement engine and the GlyphLock Door station, so managers can move through a shift without hunting across product menus.</p>
          </div>
          <div className="uv-mode" aria-live="polite">
            <small>{venue?.name || venue?.venue_name || "Active venue"}</small>
            <strong>{mode.loading ? "Loading mode…" : mode.error ? "Mode requires review" : `${mode.operatingMode} · ${mode.ledgerMode}`}</strong>
          </div>
        </header>

        <section className="uv-core">
          <div className="uv-core-icon"><ShieldCheck size={21} /></div>
          <div><strong>NUPS command center</strong><p>Venue roles, shift operations, register, staff, payouts, accounting, and NUPS records stay governed by the existing NUPS workspace and mode boundaries.</p></div>
          <div className="uv-state">Flagship platform</div>
        </section>

        <div className="uv-layout">
          <section className="uv-panel" aria-labelledby="uv-flow">
            <div className="uv-panel-head"><h2 id="uv-flow">Tonight’s operating path</h2><span>{venue?.name || "Venue workspace"}</span></div>
            <div className="uv-list">{OPERATIONAL_LINKS.map(item => <LinkCard key={item.n} item={item} onOpen={navigate} />)}</div>
          </section>

          <aside className="uv-panel" aria-label="DCE and Door connections">
            <div className="uv-panel-head"><h2>Connected product systems</h2><span>Open module</span></div>
            <div className="uv-system-list">
              <article className="uv-system">
                <div className="uv-system-title"><Building2 size={17}/><h3>NUPS venue platform</h3><span className="uv-badge">Core</span></div>
                <p>Owner, manager, staff and venue operations run in this app, with the current active venue and ledger mode.</p>
                <button type="button" onClick={() => navigate("/NUPSHub")}>Open NUPS dashboard <ArrowRight size={13}/></button>
              </article>
              <article className="uv-system">
                <div className="uv-system-title"><FileCheck2 size={17}/><h3>NUPS DCE</h3><span className="uv-badge">Live app</span></div>
                <p>Digital agreements, signatures, payment evidence, completion attestations, and protected agreement history.</p>
                <a href="https://dce.glyphlock.io" target="_blank" rel="noreferrer">Open DCE workspace <ExternalLink size={13}/></a>
              </article>
              <article className="uv-system">
                <div className="uv-system-title"><MonitorDown size={17}/><h3>GlyphLock Door desktop</h3><span className="uv-badge">Coming soon</span></div>
                <p>Dedicated Windows door terminal with persistent station cache, offline queue, kiosk mode, and thermal printer support. Desktop download and NUPS bridge are not enabled here yet.</p>
                <button type="button" disabled aria-disabled="true">Windows download coming soon <ArrowRight size={13}/></button>
              </article>
            </div>
            <div className="uv-boundary"><strong>System boundary:</strong> NUPS, DCE, and the current Door terminal do not share a single operational ledger yet. DCE keeps its agreement and evidence backend; the Windows Door build is a separate terminal. This workspace connects their entry points without merging records or changing money.</div>
          </aside>
        </div>
        <p className="uv-footer">No external DCE or Door records are copied into NUPS from this screen. Existing NUPS records continue through their canonical NUPS workflows.</p>
      </main>
    </NUPSAppShell>
  );
}

export default function NUPSUnifiedOperations() {
  return <RoleClassGuard allow={["MANAGER", "ADMIN"]}><UnifiedWorkspace /></RoleClassGuard>;
}
