import React from "react";
import { CheckCircle2, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SOC2Badge, ISO27001Badge, PCIDSSBadge, GDPRBadge, HIPAABadge } from "./BadgeSVGs";

const ComplianceBadge = ({ BadgeComponent, title, subtitle, verified = false }) => (
  <Card className="glyph-glass-card p-6 flex flex-col items-center gap-3 hover:scale-105 transition-transform group">
    <div className="grayscale group-hover:grayscale-0 transition-all duration-500">
      <BadgeComponent className="w-24 h-24" />
    </div>
    <div className="text-center">
      <div className="text-sm font-black text-white uppercase tracking-wider">{title}</div>
      <div className="text-xs text-slate-400 mt-1">{subtitle}</div>
      {verified && (
        <div className="flex items-center justify-center gap-1 mt-2">
          <CheckCircle2 className="w-3 h-3 text-green-400" />
          <span className="text-xs text-green-400">Verified</span>
        </div>
      )}
    </div>
  </Card>
);

export default function ComplianceBadges({ showVerificationWarning = true }) {
  const certifications = {
    soc2: { verified: false, inProgress: true },
    iso27001: { verified: false, inProgress: true },
    pciDss: { verified: false, inProgress: true },
    gdpr: { verified: false, inProgress: true },
    hipaa: { verified: false, inProgress: true }
  };

  return (
    <section className="py-16 relative" style={{ background: 'transparent' }}>
      <div className="container mx-auto px-4">
        {showVerificationWarning && (
          <div className="mb-8 p-4 bg-yellow-500/10 border-2 border-yellow-500/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <div className="text-sm font-bold text-yellow-300 mb-1">
                  ⚠️ COMPLIANCE VERIFICATION REQUIRED
                </div>
                <div className="text-xs text-yellow-200">
                  Framework references must not be read as third-party certification or legal compliance determinations.
                  Public certification language requires supporting evidence.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Security Framework References
          </h2>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            These references describe control-design targets and scope considerations. They are not certification badges or independent attestations.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          <ComplianceBadge
            BadgeComponent={SOC2Badge}
            title="SOC 2 Reference"
            subtitle={certifications.soc2.verified ? "Verified Program" : "Control Reference"}
            verified={certifications.soc2.verified}
          />
          <ComplianceBadge
            BadgeComponent={ISO27001Badge}
            title="ISO/IEC 27001 Reference"
            subtitle={certifications.iso27001.verified ? "Certified" : "Control Reference"}
            verified={certifications.iso27001.verified}
          />
          <ComplianceBadge
            BadgeComponent={PCIDSSBadge}
            title="PCI DSS Scope Reference"
            subtitle={certifications.pciDss.verified ? "Validated" : "Scope Dependent"}
            verified={certifications.pciDss.verified}
          />
          <ComplianceBadge
            BadgeComponent={GDPRBadge}
            title="Privacy Program"
            subtitle="Scope Dependent"
            verified={certifications.gdpr.verified}
          />
          <ComplianceBadge
            BadgeComponent={HIPAABadge}
            title="Health Data Controls"
            subtitle="Scope Dependent"
            verified={certifications.hipaa.verified}
          />
        </div>

        <div className="text-center">
          <a href="/compliance" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            View Detailed Compliance Documentation
            <CheckCircle2 className="w-4 h-4" />
          </a>
        </div>

        <div className="mt-12 p-6 bg-slate-900/50 border border-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-500 text-center leading-relaxed mt-2">
            These labels are framework references only — not formal third-party certification, regulatory approval, or a legal compliance determination.
            Independent attestation will be identified by assessor, scope, period, and supporting report when available.
            For verification inquiries, contact{" "}
            <a href="mailto:hello@glyphlock.io" className="text-blue-400 hover:underline">hello@glyphlock.io</a>.
          </p>
        </div>
      </div>
    </section>
  );
}