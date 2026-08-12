import React from "react";
import { Shield, Lock, Database, Eye, Trash2, DollarSign } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function Privacy() {
  return (
    <>
      <SEOHead 
        title="Privacy Policy | GlyphLock"
        description="GlyphLock Privacy Policy - How we protect, encrypt, and manage your data."
        url="/privacy"
      />
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black text-white py-32 relative overflow-hidden">
        {/* Cosmic Background */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-cyan-900/10 to-transparent pointer-events-none z-0" />
        <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDYsIDE4MiwgMjEyLCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20 pointer-events-none z-0" />
        <div className="glyph-orb fixed top-20 right-20 opacity-20 glyph-pulse" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3), rgba(59,130,246,0.2))' }}></div>
        
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center p-4 glyph-glass border-2 border-cyan-500/40 rounded-2xl mb-6 glyph-glow">
              <Shield className="w-12 h-12 text-cyan-400" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter font-space">
              PRIVACY <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">POLICY</span>
            </h1>
            <div className="inline-block px-4 py-2 glyph-glass border border-cyan-500/30 rounded-full">
              <p className="text-cyan-300 text-sm font-bold uppercase tracking-widest">Last Updated: May 2025</p>
            </div>
          </div>

          <div className="glyph-glass-dark rounded-3xl border-2 border-cyan-500/30 p-8 md:p-12 space-y-12 glyph-glow">
            
            {/* Scope and Purpose */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 glyph-glass border border-cyan-500/40 rounded-xl">
                  <Database className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white font-space">Scope and Purpose</h2>
              </div>
              <div className="pl-4 border-l-2 border-white/10 ml-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  This Privacy Policy explains how GlyphLock LLC collects, uses, stores, protects, and shares information when you access our websites, applications, developer tools, SDKs, APIs, consoles, vouchers, and interactive security services. It also explains your rights and choices. By using GlyphLock, you agree to these practices and to the binding terms referenced in our Terms of Service and Master Covenant disclosures.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 glyph-glass border border-blue-500/40 rounded-xl">
                  <Database className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white font-space">Information We Collect</h2>
              </div>
              <div className="pl-4 border-l-2 border-white/10 ml-6 space-y-6">
                <p className="text-gray-300">We collect only what we need to operate and secure the platform. Depending on what you use, this may include:</p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-semibold mb-2">Account and Identity Data</h3>
                    <p className="text-gray-400 text-sm">Name, email address, phone number (if provided), organization name, role, billing contact details, and authentication settings.</p>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-semibold mb-2">Content and Assets You Provide</h3>
                    <p className="text-gray-400 text-sm">Images, files, QR or steganographic payloads, metadata, hotspot maps, project configurations, uploaded documents, and any instructions you submit through our tools.</p>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-semibold mb-2">Transaction and Voucher Related Data</h3>
                    <p className="text-gray-400 text-sm">Voucher identifiers, redemption status, issuance records, access conditions, scan or tap events, payment records, refunds, chargeback outcomes, and related audit logs.</p>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-semibold mb-2">Usage and Device Data</h3>
                    <p className="text-gray-400 text-sm">IP address, device and browser type, session identifiers, timestamps, referring pages, performance metrics, error logs, and event telemetry needed to secure and improve the system.</p>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-semibold mb-2">Security and Integrity Logs</h3>
                    <p className="text-gray-400 text-sm">Authentication events, key creation and rotation events, policy changes, admin actions, API usage, anomaly flags, and tamper detection records.</p>
                  </div>
                </div>

                <div className="mt-6 p-4 glyph-glass border-2 border-cyan-500/40 rounded-xl text-center glyph-glow">
                  <p className="text-cyan-300 font-bold text-sm uppercase tracking-wide">We do not sell, rent, or trade your personal information.</p>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 glyph-glass border border-purple-500/40 rounded-xl">
                  <Eye className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white font-space">How We Use Your Information</h2>
              </div>
              <div className="pl-4 border-l-2 border-white/10 ml-6 space-y-4">
                <p className="text-gray-300">We use your data only for legitimate business and security purposes, including:</p>
                <ul className="space-y-3 text-gray-400">
                  <li className="flex items-start gap-3">
                    <span className="text-[#8C4BFF] mt-1.5 text-xs">●</span>
                    <div>
                      <strong className="text-white">Service Delivery:</strong> To provide features you request, run scans, generate outputs, process vouchers, and deliver developer and enterprise functions.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#8C4BFF] mt-1.5 text-xs">●</span>
                    <div>
                      <strong className="text-white">Security and Fraud Prevention:</strong> To verify identity, enforce access rules, detect abuse, prevent fraud, and protect users, creators, and partners.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#8C4BFF] mt-1.5 text-xs">●</span>
                    <div>
                      <strong className="text-white">Integrity and Auditability:</strong> To generate verifiable logs, maintain chain of custody for protected assets, and support dispute resolution or legal compliance.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#8C4BFF] mt-1.5 text-xs">●</span>
                    <div>
                      <strong className="text-white">Operations and Improvement:</strong> To maintain platform reliability, diagnose issues, and improve performance and features.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#8C4BFF] mt-1.5 text-xs">●</span>
                    <div>
                      <strong className="text-white">Payments and Account Administration:</strong> To process payments, refunds, subscriptions, and chargebacks, and to enforce billing eligibility and usage limits.
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            {/* Master Covenant Warning */}
            <section className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-red-400 mb-3 font-space">Master Covenant and Binding Notice</h2>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    GlyphLock operates under a dual-layer governance model consisting of standard platform terms and the Master Covenant framework. Certain actions create binding records, including but not limited to exposure to protected assets, scan or tap verification, key issuance, voucher redemption, and acceptance of enterprise policies. Covenant-bound records are stored as integrity logs and may be used to verify provenance, ownership, and compliance across human and machine systems. <strong className="text-red-400">If you do not agree to Covenant-bound operation, do not use the platform.</strong>
                  </p>
                </div>
              </div>
            </section>

            {/* Security */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 glyph-glass border border-green-500/40 rounded-xl">
                  <Lock className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white font-space">Security and Encryption</h2>
              </div>
              <div className="pl-4 border-l-2 border-white/10 ml-6 space-y-4">
                <p className="text-gray-300">We apply layered security controls appropriate for enterprise and high-value IP systems. Controls may include:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    "Encryption in transit (modern TLS)",
                    "Encryption at rest (strong mechanisms)",
                    "Zero-trust access controls",
                    "Key vault and rotation",
                    "Tamper detection and audit trails"
                  ].map((item, i) => (
                    <div key={i} className="bg-white/5 p-3 rounded-lg text-sm text-gray-300 border border-white/5">
                      {item}
                    </div>
                  ))}
                </div>
                <p className="text-gray-500 text-sm italic mt-4">No system is perfectly secure. We work to prevent incidents, but you acknowledge that residual risk exists.</p>
              </div>
            </section>

            {/* Payments and Refunds */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 glyph-glass border border-cyan-500/40 rounded-xl">
                  <DollarSign className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white font-space">Payments, Refunds, and Chargebacks</h2>
              </div>
              <div className="pl-4 border-l-2 border-white/10 ml-6 space-y-4">
                <p className="text-gray-300">Payments are processed through approved payment providers. By purchasing, you authorize GlyphLock to charge your selected payment method for the amounts displayed at checkout.</p>
                
                <div>
                  <h3 className="text-white font-semibold mb-2">Refunds</h3>
                  <p className="text-gray-400 text-sm">Refund eligibility depends on the product or plan purchased. Digital services, one-time token purchases, or redeemed vouchers are generally non-refundable once delivered or used, unless otherwise required by law or explicitly stated at purchase. Subscription refunds are prorated only if required by law or specified in your plan terms.</p>
                </div>
                
                <div>
                  <h3 className="text-white font-semibold mb-2">Chargebacks</h3>
                  <p className="text-gray-400 text-sm">If you file a chargeback, we may suspend access to the account and associated assets while the dispute is reviewed. We will provide transaction records, usage logs, voucher redemption logs, and integrity proofs to the payment provider to contest fraudulent or bad-faith chargebacks. If a chargeback is resolved against you, we may recover unpaid balances, revoke related licenses, and disable associated API keys or vouchers.</p>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 glyph-glass border border-orange-500/40 rounded-xl">
                  <Trash2 className="w-6 h-6 text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-white font-space">Data Retention</h2>
              </div>
              <div className="pl-4 border-l-2 border-white/10 ml-6 space-y-4">
                <p className="text-gray-300">
                  We retain data only as long as needed to operate the platform, meet legal obligations, enforce the Covenant, and resolve disputes. Retention periods vary by data type:
                </p>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    <span>Account and billing records are kept as required for compliance.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    <span>Security and integrity logs may be retained longer to support provenance, fraud prevention, and legal enforceability.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    <span>Uploaded content remains until you delete it, unless it is required for an ongoing dispute, legal hold, or covenant enforcement record.</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 glyph-glass border border-purple-500/40 rounded-xl">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white font-space">Your Rights and Choices</h2>
              </div>
              <div className="pl-4 border-l-2 border-white/10 ml-6 space-y-4">
                <p className="text-gray-300">
                  You can request access, correction, export, or deletion of your personal data, subject to legal and covenant-bound retention requirements. Some records cannot be deleted if they are required to preserve system integrity, resolve disputes, or comply with law. You can manage most privacy settings inside your account, or contact us directly.
                </p>
              </div>
            </section>

            {/* Compliance Frameworks */}
            <section className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 glyph-glass border border-blue-500/40 rounded-xl">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white font-space">Compliance Frameworks</h2>
              </div>
              <div className="pl-4 border-l-2 border-white/10 ml-6 space-y-6">
                <p className="text-gray-300">GlyphLock adheres to major international privacy and security frameworks to ensure your data is protected according to the highest standards.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                  {[
                    { name: "GDPR", desc: "General Data Protection Regulation", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/db009bbe8_1766062456894.jpg" },
                    { name: "CCPA", desc: "California Consumer Privacy Act", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/0dfb7aa86_1766061731969.jpg" }, // Using ISO image as placeholder or generic shield if CCPA specific not avail, but here reusing relevant ones or generic
                    { name: "HIPAA", desc: "Health Insurance Portability and Accountability Act", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/c848fdb95_1766062491421.jpg" },
                    { name: "SOC 2", desc: "Service Organization Control 2", image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/ec8675dc5_1766064945798.jpg" }
                  ].map((framework, i) => (
                    <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                      <img src={framework.image} alt={framework.name} className="w-16 h-16 object-contain mb-3 drop-shadow-lg" />
                      <h3 className="text-white font-bold text-sm mb-1">{framework.name}</h3>
                      <p className="text-gray-400 text-xs">{framework.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="mt-16 p-8 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-2 border-cyan-500/30 rounded-2xl text-center glyph-glow">
              <h2 className="text-3xl font-bold text-white mb-4 font-space">Contact Privacy Officer</h2>
              <p className="text-gray-300 mb-2">Privacy Officer, GlyphLock LLC</p>
              <p className="text-gray-400 mb-6">El Mirage, Arizona</p>
              <a 
                href="mailto:carloearl@glyphlock.com" 
                className="inline-flex items-center justify-center bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold uppercase tracking-wide px-8 py-4 rounded-xl transition-all shadow-lg glyph-glow min-h-[52px]"
              >
                carloearl@glyphlock.com
              </a>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}