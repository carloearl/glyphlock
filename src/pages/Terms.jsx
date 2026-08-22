import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";

export default function Terms() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing and using GlyphLock services, you accept and agree to be bound by these terms and conditions."
    },
    {
      title: "2. Service Description",
      content: "GlyphLock provides connected image-carrier, Secure QR, AI-assisted, NUPS venue-operations, value-record, integration, governance, and related software services."
    },
    {
      title: "3. User Obligations",
      content: "You agree to use our services lawfully and not to engage in activities that could harm our systems or other users. You are responsible for maintaining the confidentiality of your account."
    },
    {
      title: "4. Intellectual Property",
      content: "All GlyphLock technology, including the Master Covenant, software, and documentation, is protected by intellectual property laws and the CAB framework. Unauthorized use is prohibited."
    },
    {
      title: "5. Limitation of Liability",
      content: "GlyphLock is provided 'as is' without warranties. We are not liable for indirect, incidental, or consequential damages arising from service use."
    },
    {
      title: "6. Termination",
      content: "We reserve the right to terminate or suspend access to our services at any time for violations of these terms."
    },
    {
      title: "7. Governing Law",
      content: "These terms are governed by the laws of Arizona, United States. Disputes will be resolved in Arizona courts."
    },
    {
      title: "8. Changes to Terms",
      content: "We may modify these terms at any time. Continued use of our services constitutes acceptance of modified terms."
    },
    {
      title: "9. Payments — Stripe Is Our Exclusive Payment Processor",
      content: "Stripe, Inc. is the sole and exclusive payment processor for GlyphLock and NUPS. We do not accept or process card payments through any other gateway, aggregator, or processor. By making a payment you also agree to Stripe's applicable terms and authorize Stripe to process your payment details. Card numbers, magnetic-stripe track data, chip data, CVV/CVC values, and PINs are never stored on GlyphLock systems — card entry and authorization occur in Stripe-hosted checkout, Stripe Elements, or a Stripe-connected physical terminal. GlyphLock retains only Stripe reference identifiers, payment status, amount, currency, card brand, expiration, last four digits, approval code, and timestamps."
    },
    {
      title: "10. Payment Authority, Pricing, and Confirmation",
      content: "All amounts, taxes, fees, discounts, and totals are calculated or independently verified server-side. Client-supplied prices or payment statuses are never trusted. A payment is treated as complete only when GlyphLock receives a signature-verified Stripe webhook event confirming it; a browser redirect, on-screen message, or emailed receipt is not by itself proof of payment. Where the same operation may be retried, idempotency controls apply so that a single authorization is not duplicated. Payments in a Stripe test mode carry no monetary value and confer no entitlement."
    },
    {
      title: "11. Refunds, Disputes, and Chargebacks",
      content: "Refunds are issued exclusively through Stripe and are mirrored into GlyphLock transaction, receipt, and ledger records. Refund eligibility is governed by the applicable purchase, subscription, venue, or service terms and by rights available under law. If you initiate a chargeback, you authorize GlyphLock to submit evidence to Stripe, including transaction records, receipts, service and delivery history, audit events, and relevant communications. Corrections to financial history are recorded as traceable adjustments rather than silent rewrites, and financial records are retained for the periods required by accounting, tax, dispute, and legal-hold obligations."
    },
    {
      title: "12. Venue Card Readers and Terminals",
      content: "Where NUPS supports a card reader such as an Adesso device, that reader captures only cardholder name, card brand, expiration, and last four digits for identification on a venue record. It does not authorize funds and is not a payment terminal. All card authorization must occur through Stripe or through the venue's own certified payment terminal. Venues are solely responsible for maintaining PCI DSS obligations applicable to hardware and environments they operate, and for lawful use of identity, scanning, and card-capture features they enable."
    },
    {
      title: "13. Oracle Hospitality Integration Platform (OHIP)",
      content: "GlyphLock's integration request for the Oracle Hospitality Integration Platform (OHIP) has been approved, providing NUPS with an authorized integration pathway to Oracle Hospitality property-management systems for participating properties. Where a property enables this integration, GlyphLock may exchange only the operational records required for the enabled workflow, such as reservation or folio references, room and charge postings, property-supplied guest identifiers, and posting confirmations. OHIP credentials are held server-side only. Card authorization is never routed through OHIP and remains with Stripe or the property's certified terminal. OHIP approval is an authorization to integrate; it is not a security certification, an Oracle endorsement of GlyphLock, or a warranty of availability, uptime, or any particular property configuration. Oracle and Oracle Hospitality are trademarks of Oracle Corporation, and Stripe is a trademark of Stripe, Inc.; use of these names indicates integration only, not affiliation or sponsorship."
    },
    {
      title: "14. Third-Party Service Dependencies",
      content: "Payment, hospitality, hosting, AI, communications, and storage functions depend on third-party providers, including Stripe and Oracle. GlyphLock is not responsible for outages, policy changes, account actions, pricing changes, or service discontinuation by those providers. If a provider suspends or restricts service, affected GlyphLock features may be unavailable until the condition is resolved."
    }
  ];

  return (
    <>
      <SEOHead 
        title="Terms of Service | GlyphLock"
        description="Terms governing use of GlyphLock image, QR, AI-assisted, NUPS, payment, hospitality-integration, recordkeeping, and related services."
        url="/terms"
      />
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black text-white py-32 relative overflow-hidden">
        {/* Cosmic Background */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-cyan-900/10 to-transparent pointer-events-none z-0" />
        <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDYsIDE4MiwgMjEyLCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20 pointer-events-none z-0" />
        <div className="glyph-orb fixed top-20 right-20 opacity-20 glyph-pulse" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3), rgba(59,130,246,0.2))' }}></div>
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black mb-4 font-space tracking-tight">
              TERMS OF <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">SERVICE</span>
            </h1>
            <div className="inline-block px-4 py-2 glyph-glass border border-cyan-500/30 rounded-full">
              <p className="text-cyan-300 text-sm font-bold uppercase tracking-widest">Last Updated: August 18, 2026</p>
            </div>
          </div>

          <div className="space-y-6">
            {sections.map((section, idx) => (
              <div key={idx} className="glyph-glass-dark rounded-xl border border-cyan-500/20 p-6 hover:border-cyan-500/40 transition-colors">
                <h2 className="text-xl font-bold text-white mb-3 font-space">{section.title}</h2>
                <p className="text-gray-400 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 glyph-glass-dark rounded-xl border-2 border-cyan-500/30 p-8 text-center glyph-glow">
            <h3 className="text-xl font-bold text-white mb-4">Contact Us</h3>
            <p className="text-gray-300">
              For questions about these terms, contact us at{" "}
              <a href="mailto:carloearl@glyphlock.com" className="text-[#00E4FF] hover:text-white font-bold transition-colors">
                carloearl@glyphlock.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}