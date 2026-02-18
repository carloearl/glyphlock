import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import AuditPanel from "@/components/sitebuilder/AuditPanel";
import BuilderTerminal from "@/components/sitebuilder/BuilderTerminal";

export default function GlyphLockAudit() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState('audit');

  useEffect(() => {
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) { toast.error('Sign in required'); window.location.href = '/'; return; }
        const u = await base44.auth.me();
        if (u.role !== 'admin' && !['carloearl@glyphlock.com', 'carloearl@gmail.com'].includes(u.email)) {
          toast.error('Admin access required'); window.location.href = '/'; return;
        }
        setUser(u);
      } catch (err) { toast.error('Auth failed'); } 
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050508]">
        <Loader2 className="w-12 h-12 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="GlyphLock System Audit & Builder" description="Full platform diagnostic with AI-powered audit and live terminal" />
      
      <div className="min-h-screen bg-[#050508] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-[#1e1e2e] px-4 md:px-8 h-16 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #0d0d14 0%, #13131f 50%, #0d0d14 100%)' }}>
          <div className="font-['Bebas_Neue',sans-serif] text-2xl tracking-[4px]">
            <span className="bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">GLYPH</span>
            <span className="text-cyan-400">LOCK</span>
          </div>
          <div className="flex bg-[#0d0d14] border border-[#1e1e2e] rounded-lg overflow-hidden">
            <button onClick={() => setActivePanel('audit')}
              className={`px-5 py-2 font-mono text-[11px] tracking-wider uppercase transition-all ${
                activePanel === 'audit' ? 'bg-red-500 text-white' : 'text-[#6b6b8a] hover:text-white hover:bg-[#1e1e2e]'
              }`}>AUDIT REPORT</button>
            <button onClick={() => setActivePanel('builder')}
              className={`px-5 py-2 font-mono text-[11px] tracking-wider uppercase transition-all ${
                activePanel === 'builder' ? 'bg-red-500 text-white' : 'text-[#6b6b8a] hover:text-white hover:bg-[#1e1e2e]'
              }`}>SITE BUILDER</button>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-red-500 border border-red-500/50 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            LIVE AUDIT ACTIVE
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {activePanel === 'audit' && <AuditPanel />}
          {activePanel === 'builder' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 140px)' }}>
              {/* Left: Terminal */}
              <div className="flex flex-col">
                <h2 className="font-['Bebas_Neue',sans-serif] text-xl tracking-[3px] text-white mb-3">
                  LIVE TERMINAL
                </h2>
                <div className="flex-1 min-h-[500px]">
                  <BuilderTerminal />
                </div>
              </div>
              
              {/* Right: Quick Actions */}
              <div className="flex flex-col">
                <h2 className="font-['Bebas_Neue',sans-serif] text-xl tracking-[3px] text-white mb-3">
                  SYSTEM MODULES
                </h2>
                <div className="grid grid-cols-1 gap-3 overflow-y-auto">
                  <ModuleCard icon="💳" title="Stripe Integration" 
                    desc="Payment intents, webhooks, refund processing"
                    status="configured" statusLabel="ACTIVE" />
                  <ModuleCard icon="🗄️" title="Database (Base44)" 
                    desc="Entity schemas, RLS policies, real-time subscriptions"
                    status="configured" statusLabel="ACTIVE" />
                  <ModuleCard icon="🔐" title="Auth & Security" 
                    desc="MFA, JWT, role-based access, session management"
                    status="configured" statusLabel="ACTIVE" />
                  <ModuleCard icon="🖨️" title="Club Currency Press" 
                    desc="Steganographic QR, thermal print, denomination system"
                    status="configured" statusLabel="ACTIVE" />
                  <ModuleCard icon="📊" title="Analytics & Tracking" 
                    desc="Event tracking, usage analytics, audit logging"
                    status="partial" statusLabel="PARTIAL" />
                  <ModuleCard icon="📧" title="Email (SendGrid)" 
                    desc="Transactional emails, contract delivery"
                    status="configured" statusLabel="ACTIVE" />
                  <ModuleCard icon="🤖" title="AI Agents" 
                    desc="GlyphBot, SiteBuilder, SIE Architect, Alfred"
                    status="configured" statusLabel="ACTIVE" />
                  <ModuleCard icon="🌐" title="Domain & SSL" 
                    desc="Custom domain, HTTPS enforcement, DNS"
                    status="warning" statusLabel="CHECK DNS" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ModuleCard({ icon, title, desc, status, statusLabel }) {
  const borderColor = status === 'configured' ? 'border-green-500/30' : 
    status === 'partial' ? 'border-yellow-500/30' : 'border-red-500/30';
  const statusColor = status === 'configured' ? 'text-green-500 bg-green-500/10 border-green-500/30' :
    status === 'partial' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' :
    'text-red-500 bg-red-500/10 border-red-500/30';

  return (
    <div className={`bg-[#0d0d14] border ${borderColor} rounded-lg p-4 flex items-start gap-3 hover:bg-[#13131f] transition-colors`}>
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <span className={`font-mono text-[9px] px-2 py-0.5 rounded border font-bold uppercase ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-[11px] text-[#6b6b8a] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}