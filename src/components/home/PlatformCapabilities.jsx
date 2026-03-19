import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const modules = [
  {
    title: 'QR Verification Studio',
    desc: 'Generates tamper resistant QR codes supported by blockchain anchored provenance chains, artificial intelligence risk scoring, and steganographic payload embedding. These codes act as verifiable digital gateways linking physical environments to secure digital interaction.'
  },
  {
    title: 'Image Lab',
    desc: 'Provides artificial intelligence image generation, interactive hotspot editing, and multimodal visual analysis. Every asset is secured through SHA-256 hash verification and immutable audit trails to ensure authenticity and traceability.'
  },
  {
    title: 'GlyphBot Intelligence',
    desc: 'Multi-provider AI assistant performing site auditing, vulnerability scanning, code analysis, and natural language threat assessment through distributed large language model routing architecture.'
  },
  {
    title: 'N.U.P.S. Infrastructure',
    desc: 'Venue grade point of sale platform supporting staff RBAC management, entertainer scheduling, VIP guest tracking, automated Z report generation, and the Club Currency Press for custom voucher and GlyphBucks™ issuance with digital contract signing and biometric verification.'
  },
  {
    title: 'GlyphLock Financial',
    desc: 'Provides underwriting dossier generation, deterministic risk scoring, and qualification assessment frameworks designed for institutional compliance review and financial infrastructure partnerships.'
  },
  {
    title: 'Blockchain Verification',
    desc: 'Creates timestamped cryptographic proofs exportable as evidentiary records for transactions, digital media assets, and operational events across the platform.'
  },
  {
    title: 'Master Covenant Governance',
    desc: 'Structured governance architecture defining accountability standards, enforcement protocols, and compliance alignment across multi-provider artificial intelligence systems.'
  },
  {
    title: 'Security Operations Center',
    desc: 'Continuous monitoring environment providing alert thresholds, operational visibility, and live threat intelligence across the GlyphLock infrastructure surface.'
  },
];

export default function PlatformCapabilities() {
  return (
    <section style={{ background: '#050505', color: '#e6e6e6', padding: '120px 20px', fontFamily: 'Inter, system-ui, monospace' }}>
      <div style={{ maxWidth: '1200px', margin: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '60px' }}>
          <span style={{ color: '#00ffd0', fontSize: '12px', letterSpacing: '3px' }}>
            GLYPHLOCK SECURITY PLATFORM
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', marginTop: '10px', marginBottom: '20px', color: '#ffffff', fontWeight: 700 }}>
            Platform Capabilities
          </h2>
          <p style={{ color: '#9aa3a9', lineHeight: '1.7', maxWidth: '900px', fontSize: '16px' }}>
            GlyphLock Security LLC delivers a unified cybersecurity and digital infrastructure platform combining quantum-resistant encryption, artificial intelligence driven threat detection, and visual cryptography. The system is architected for organizations operating in zero-trust environments where verification, accountability, and operational transparency are essential. Post-quantum cryptographic primitives aligned with NIST PQC standards ensure the platform remains resilient against emerging computational threats.
          </p>
        </div>

        {/* Module Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '30px',
          marginBottom: '80px'
        }}>
          {modules.map((mod) => (
            <ModuleCard key={mod.title} title={mod.title} desc={mod.desc} />
          ))}
        </div>

        {/* IP Section */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '40px', marginBottom: '40px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '16px', color: '#ffffff' }}>
            Intellectual Property — GlyphBucks™
          </h3>
          <p style={{ color: '#9aa3a9', lineHeight: '1.7', marginBottom: '16px', fontSize: '15px' }}>
            GlyphBucks™ is a proprietary legal instrument and registered trademark of GlyphLock Financial LLC. The GlyphBucks system including its physical bill design, digital contract architecture, redemption protocol, biometric verification workflow, and Club Currency Press technology constitutes original copyrighted works owned exclusively by GlyphLock Financial LLC.
          </p>
          <p style={{ color: '#9aa3a9', lineHeight: '1.7', fontSize: '15px' }}>
            Venue operators are licensed users only and retain no ownership interest in the GlyphBucks™ instrument or the underlying intellectual property. Unauthorized reproduction or fraudulent issuance of GlyphBucks™ instruments may constitute counterfeiting and will be prosecuted to the fullest extent of applicable law.
          </p>
        </div>

        {/* Compliance */}
        <div style={{ fontSize: '13px', color: '#7f8a90', marginBottom: '60px', lineHeight: '1.6' }}>
          GlyphLock Security is architected to align with SOC 2, ISO 27001, PCI DSS, GDPR, and HIPAA security frameworks. These designations represent architectural compatibility and do not constitute formal certification unless explicitly stated in a written agreement.
        </div>

        {/* Doctrine */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h3 style={{ fontSize: '22px', marginBottom: '16px', color: '#ffffff' }}>
            Secure Infrastructure For Real World Systems
          </h3>
          <p style={{ color: '#9aa3a9', lineHeight: '1.7', maxWidth: '800px', margin: '0 auto 20px', fontSize: '15px' }}>
            GlyphLock connects cybersecurity, artificial intelligence, digital identity, and venue infrastructure into a unified operational environment. Through blockchain verification, visual cryptography, and automated intelligence systems, organizations can deploy trusted digital interaction in environments where transparency, accountability, and security are required.
          </p>
          <p style={{ fontSize: '18px', color: '#ffffff', lineHeight: '1.6' }}>
            GlyphLock is not simply a security platform.<br />
            It is infrastructure for the next generation of digital systems.
          </p>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <Link
            to="/CommandCenter"
            style={{
              background: '#00ffd0',
              color: '#000',
              padding: '14px 28px',
              textDecoration: 'none',
              fontWeight: '600',
              borderRadius: '4px',
              fontSize: '14px',
              letterSpacing: '1px'
            }}
          >
            ENTER THE GLYPHLOCK SYSTEM
          </Link>
          <Link
            to="/Services"
            style={{
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '14px 28px',
              textDecoration: 'none',
              color: '#cbd1d6',
              borderRadius: '4px',
              fontSize: '14px',
              letterSpacing: '1px',
              transition: '0.25s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ffd0'; e.currentTarget.style.color = '#00ffd0'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#cbd1d6'; }}
          >
            REVIEW PLATFORM CAPABILITIES
          </Link>
        </div>

      </div>
    </section>
  );
}

function ModuleCard({ title, desc }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? '#00ffd0' : 'rgba(255,255,255,0.08)'}`,
        padding: '24px',
        borderRadius: '6px',
        background: '#0a0a0a',
        transition: '0.25s'
      }}
    >
      <h3 style={{ marginBottom: '10px', fontSize: '18px', color: '#ffffff' }}>{title}</h3>
      <p style={{ color: '#9aa3a9', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{desc}</p>
    </div>
  );
}