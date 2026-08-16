import React from "react";
import { Link } from "react-router-dom";
import { Shield, Lock, Database, Eye, Trash2, DollarSign, Building2, UserCheck, FileText, Server, ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { createPageUrl } from "@/utils";

const InfoCard = ({ icon: Icon, title, children, accent = "cyan" }) => {
  const styles = {
    cyan: "border-cyan-400/30 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,.10)]",
    blue: "border-blue-400/30 text-blue-300 shadow-[0_0_30px_rgba(59,130,246,.10)]",
    violet: "border-violet-400/30 text-violet-300 shadow-[0_0_30px_rgba(139,92,246,.10)]",
    emerald: "border-emerald-400/30 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,.10)]",
    amber: "border-amber-400/30 text-amber-300 shadow-[0_0_30px_rgba(245,158,11,.10)]",
  };

  return (
    <section className={`rounded-2xl border bg-black/25 backdrop-blur-xl p-6 md:p-8 ${styles[accent]}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-current/20 bg-white/[.035]">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{title}</h2>
      </div>
      <div className="space-y-4 text-sm md:text-base leading-relaxed text-slate-300">{children}</div>
    </section>
  );
};

export default function Privacy() {
  return (
    <>
      <SEOHead
        title="Privacy Policy | GlyphLock LLC"
        description="GlyphLock LLC privacy policy covering GlyphLock products, NUPS venue operations, developer tools, AI-assisted services, financial workflows, security logs, and user privacy rights."
        url="/privacy"
      />

      <main className="relative min-h-screen overflow-hidden bg-transparent text-white py-24 md:py-32">
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,.12),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(139,92,246,.12),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,.08),transparent_34%)]" />
        <div className="fixed inset-0 pointer-events-none opacity-20" style={{backgroundImage:'linear-gradient(rgba(34,211,238,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.08) 1px,transparent 1px)',backgroundSize:'48px 48px'}} />

        <div className="relative z-10 mx-auto max-w-5xl px-5 md:px-8">
          <header className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/[.06] px-4 py-2 font-mono text-[10px] tracking-[.22em] text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,.14)]">
              <Shield className="h-4 w-4" /> GLYPHLOCK PRIVACY // PUBLIC POLICY
            </div>
            <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-[-.045em] leading-[.9]">
              PRIVACY <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400">POLICY</span>
            </h1>
            <p className="mt-5 text-sm text-slate-400">Last updated: August 15, 2026</p>
            <p className="mt-5 mx-auto max-w-3xl text-base md:text-lg leading-relaxed text-slate-300">
              This policy explains how GlyphLock LLC handles personal information across GlyphLock websites, applications, APIs, developer tools, AI-assisted services, QR and verification tools, financial workflows, and the NUPS venue operations platform.
            </p>
          </header>

          <div className="mb-8 rounded-2xl border border-cyan-300/25 bg-cyan-300/[.045] p-5 md:p-6 shadow-[0_0_35px_rgba(34,211,238,.10)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] tracking-[.2em] text-cyan-300">NUPS PRIVACY COVERAGE</div>
                <p className="mt-2 text-sm md:text-base text-slate-300">NUPS users, venue operators, staff, guests, contractors, drivers, and customers are covered by this policy where GlyphLock processes information through the platform.</p>
              </div>
              <Link to={createPageUrl("NUPSLanding")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/45 bg-cyan-300/10 px-5 py-3 font-black text-cyan-100 hover:bg-cyan-300/20 hover:shadow-[0_0_30px_rgba(34,211,238,.25)] transition-all">
                OPEN NUPS <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <InfoCard icon={Database} title="Scope and Purpose" accent="cyan">
              <p>This Privacy Policy applies when GlyphLock LLC determines how personal information is handled through our own products and services. In some NUPS deployments, a venue or enterprise customer may determine the purpose and means of processing certain records. In those cases, that customer may have its own privacy notice and may act as the primary business, controller, or data owner for those records.</p>
              <p>Using the platform does not waive privacy rights provided by applicable law. Contract terms, enterprise agreements, and governance records may affect retention, access, and operational responsibilities, but they do not override rights that cannot legally be waived.</p>
            </InfoCard>

            <InfoCard icon={Eye} title="Information We Collect" accent="blue">
              <p>Depending on the product, role, configuration, and workflow you use, we may process the following categories:</p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  ["Account and identity data", "Name, email, phone number if provided, organization, role, account identifiers, authentication settings, and account status."],
                  ["Content and assets", "Images, files, QR payloads, metadata, hotspot maps, project settings, uploaded documents, prompts, instructions, and generated outputs."],
                  ["Usage and device data", "IP address, browser and device details, session identifiers, timestamps, referring pages, performance information, errors, and operational telemetry."],
                  ["Security and audit data", "Authentication events, access events, key activity, role changes, admin actions, API usage, anomaly flags, integrity records, and audit logs."],
                  ["Transaction and financial workflow data", "Transaction references, payment status, refunds, chargebacks, settlement records, payout records, receipts, ledger entries, and related audit information."],
                  ["Support and communications", "Messages, consultation requests, feedback, support conversations, and information you provide when contacting GlyphLock."],
                ].map(([name, text]) => (
                  <div key={name} className="rounded-xl border border-white/10 bg-white/[.035] p-4">
                    <h3 className="font-bold text-white">{name}</h3>
                    <p className="mt-2 text-sm text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-emerald-300/30 bg-emerald-300/[.05] px-4 py-3 text-emerald-100 font-semibold">GlyphLock does not sell personal information for money.</div>
            </InfoCard>

            <InfoCard icon={Building2} title="NUPS Venue Operations Data" accent="violet">
              <p>NUPS is GlyphLock&apos;s venue operations platform. Depending on a venue&apos;s enabled features and operating configuration, NUPS may process operational records relating to staff, guests, contractors, drivers, transactions, contracts, access, and venue activity.</p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  ["Staff and role records", "Role assignment, clock-in/clock-out records, shift activity, permissions, operational actions, and related audit history."],
                  ["Guest and customer records", "Names or account identifiers, visit or transaction context, QR identifiers, service records, and other information entered or captured by enabled venue workflows."],
                  ["Identity verification", "Information derived from supported identity-verification workflows, including document or scanner data where enabled. Venues are responsible for using these features lawfully and providing any required notices."],
                  ["Biometric-enabled workflows", "If a venue enables a biometric feature, applicable consent, notice, retention, and deletion requirements must be addressed by the venue and GlyphLock according to the deployment and applicable law."],
                  ["Contracts and signatures", "VIP or other venue agreements, signatures, timestamps, document images, status information, and record links used to preserve the transaction history."],
                  ["POS, payouts, and settlement", "Point-of-sale records, shift close information, payout calculations, settlement summaries, reconciliation information, and audit events."],
                ].map(([name, text]) => (
                  <div key={name} className="rounded-xl border border-violet-300/15 bg-violet-300/[.035] p-4">
                    <h3 className="font-bold text-white">{name}</h3>
                    <p className="mt-2 text-sm text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-400">A venue or enterprise customer may be responsible for notices, permissions, lawful-basis decisions, employee communications, and responding to certain privacy requests for records it controls.</p>
            </InfoCard>

            <InfoCard icon={UserCheck} title="How We Use Information" accent="cyan">
              <ul className="space-y-3">
                <li><strong className="text-white">Provide the service:</strong> operate requested platform features, NUPS workflows, QR and verification tools, AI-assisted functions, developer tools, and customer support.</li>
                <li><strong className="text-white">Security and fraud prevention:</strong> authenticate users, enforce roles, detect abuse, investigate suspicious activity, protect accounts, and preserve system integrity.</li>
                <li><strong className="text-white">Transactions and operations:</strong> support purchases, refunds, settlements, payouts, receipts, accounting workflows, and dispute records.</li>
                <li><strong className="text-white">Reliability and improvement:</strong> diagnose errors, measure performance, improve interfaces, maintain availability, and develop features.</li>
                <li><strong className="text-white">Legal and contractual obligations:</strong> maintain records where needed for compliance, disputes, legal holds, contracts, security investigations, and regulatory obligations.</li>
              </ul>
            </InfoCard>

            <InfoCard icon={FileText} title="Master Covenant and Governance Records" accent="violet">
              <p>The Master Covenant is part of GlyphLock&apos;s governance and documentation framework. It may be incorporated into agreements, policies, records, or workflows where the relevant parties receive notice and the applicable contractual requirements are satisfied.</p>
              <p>GlyphLock may preserve provenance, verification, consent, acceptance, audit, and integrity records associated with platform actions. We do not rely on this Privacy Policy to claim that passive viewing, mere exposure to content, or machine processing by itself creates a contract where applicable law requires additional elements of agreement.</p>
            </InfoCard>

            <InfoCard icon={Lock} title="Security" accent="emerald">
              <p>GlyphLock uses layered technical and organizational safeguards appropriate to the service and deployment. These may include encrypted network transport, protected storage, role-based access, multi-factor authentication, key-management practices, audit logging, monitoring, and tamper-evident records.</p>
              <p>No online system can be guaranteed completely secure. Security controls reduce risk but cannot eliminate all threats, misuse, failures, or unauthorized access.</p>
            </InfoCard>

            <InfoCard icon={Server} title="Service Providers and Data Sharing" accent="blue">
              <p>We may use infrastructure, hosting, database, authentication, analytics, communications, AI, payment, storage, security, and integration providers to operate GlyphLock and NUPS. These providers may process information only as needed for the service they provide and subject to applicable agreements and legal requirements.</p>
              <p>We may also disclose information when required by law, to protect rights or safety, investigate abuse or fraud, enforce agreements, respond to lawful requests, or support a business transaction such as a financing, merger, acquisition, or asset transfer subject to appropriate safeguards.</p>
            </InfoCard>

            <InfoCard icon={DollarSign} title="Payments, Refunds, and Chargebacks" accent="amber">
              <p>Payment information may be processed by payment providers rather than stored directly by GlyphLock. Transaction, usage, settlement, and audit records may be used to administer refunds, investigate disputes, respond to chargebacks, and document delivery of services.</p>
              <p>Refund eligibility is governed by the applicable purchase, subscription, venue, or service terms and by rights that apply under law.</p>
            </InfoCard>

            <InfoCard icon={Trash2} title="Retention and Deletion" accent="amber">
              <p>We retain information for as long as reasonably necessary for the purpose for which it was collected, including platform operation, security, accounting, contractual obligations, fraud prevention, legal requirements, disputes, and backup cycles.</p>
              <p>Retention differs by record type. Some audit, transaction, contract, security, and legal-hold records may need to be retained after an account or individual content item is deleted. Where a venue controls NUPS records, requests may need to be directed to that venue.</p>
            </InfoCard>

            <InfoCard icon={Shield} title="Your Privacy Rights and Choices" accent="cyan">
              <p>Depending on your location and relationship with GlyphLock, you may have rights to request access, correction, deletion, portability, restriction, objection, or information about how personal data is handled. Some rights are subject to exceptions and verification requirements.</p>
              <p>If your request concerns NUPS data controlled by a specific venue or enterprise customer, we may direct you to that organization or assist it in responding.</p>
            </InfoCard>

            <InfoCard icon={ShieldCheck} title="Compliance and Security Framework References" accent="emerald">
              <p>GlyphLock designs parts of its architecture and operational controls with reference to recognized privacy and security frameworks, including GDPR principles, U.S. state privacy requirements, SOC 2 control concepts, ISO/IEC 27001 security-management concepts, PCI DSS requirements where payment-card scope applies, and HIPAA requirements only where GlyphLock is actually acting in a regulated covered-entity or business-associate context.</p>
              <p className="text-slate-400">Framework references describe design alignment, program goals, or applicable obligations. They do not mean GlyphLock holds a third-party certification, attestation, or regulatory approval unless that status is explicitly identified and supported by current documentation.</p>
            </InfoCard>

            <section className="rounded-3xl border border-cyan-300/30 bg-gradient-to-br from-cyan-300/[.06] via-blue-500/[.05] to-violet-500/[.06] p-8 text-center shadow-[0_0_45px_rgba(34,211,238,.12)]">
              <h2 className="text-2xl md:text-3xl font-black text-white">Contact the Privacy Officer</h2>
              <p className="mt-3 text-slate-300">GlyphLock LLC · El Mirage, Arizona · United States</p>
              <a href="mailto:carloearl@glyphlock.com" className="mt-6 inline-flex items-center justify-center rounded-xl border border-cyan-200/50 bg-cyan-300/10 px-6 py-3 font-black text-cyan-100 hover:bg-cyan-300/20 hover:shadow-[0_0_28px_rgba(34,211,238,.25)] transition-all">
                carloearl@glyphlock.com
              </a>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
