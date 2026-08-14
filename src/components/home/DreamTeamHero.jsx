// ARCHETYPE COMPONENT (Protected Archetypes - 4 cards)
// Do not use on Home page Dream Team section.
// Canonical Dream Team is HomeDreamTeam + DreamTeamFlipCard + components/data/dreamTeam

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy, Shield, Lock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import HeroHolographicCard from './HeroHolographicCard';

// UPDATED Dream Team Data - Connected to GlyphLock Brand & Binding
const DREAM_TEAM = [
  {
    id: 'founder',
    name: 'Carlo',
    number: '#1',
    position: 'Founder',
    series: 'Architect of the Covenant',
    team: 'GlyphLock',
    frontImage: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/de0d456fc_8e7cf5cc-e685-4876-a598-a4634e11ac54.jpg',
    bindingType: 'Origin of the Binding Framework',
    bindingDate: '2025-01-01T00:00:00Z',
    covenant: 'Master Covenant',
    quote: 'Every deal and deployment stays traceable and enforceable.',
    binding: {
      method: 'Protected: Vision, IP, and original covenant language.',
      mechanism: 'Bound via: Master Covenant + CAB + QR-anchored proof.',
      protocol: 'Result: Every deal and deployment stays traceable and enforceable.'
    },
    cryptoSignature: {
      algorithm: 'SHA-256',
      hash: 'd4e9c8f2a1b7e6d5c3a9f8e7b6d5a4c3b2a1e9f8',
      publicKey: '0x7F2c...8E4a',
      timestamp: 1735689600,
      verified: true
    },
    stats: { logic: 98, security: 99, creativity: 95, speed: 92 },
    borderColor: 'from-indigo-500 via-violet-400 to-blue-500',
    glowColor: 'rgba(87,61,255,0.7)'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Risk',
    number: '#2',
    position: 'Insurers & Infrastructure',
    series: 'Zero-trust verification at scale',
    team: 'GlyphLock',
    frontImage: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/e07f01522_3a737132-cd11-4d00-8626-41d6018598ec.jpg',
    bindingType: 'ENTERPRISE_BINDING',
    bindingDate: '2025-02-01T09:15:00Z',
    covenant: 'Master Covenant',
    quote: 'Synthetic fraud and forged evidence are blocked in real time.',
    binding: {
      method: 'Protected: high-value policies, claims data, audit trails.',
      mechanism: 'Bound via: PQC glyphs, signed audits, and velocity-verified scans.',
      protocol: 'Result: Synthetic fraud and forged evidence are blocked in real time.'
    },
    cryptoSignature: {
      algorithm: 'RSA-4096',
      hash: 'a8b7c6d5e4f3a2b1c9d8e7f6a5b4c3d2e1f0a9b8',
      publicKey: '0x3A1b...9C2d',
      timestamp: 1738396500,
      verified: true
    },
    stats: { logic: 96, security: 98, creativity: 88, speed: 94 },
    borderColor: 'from-emerald-500 via-green-400 to-emerald-500',
    glowColor: 'rgba(16,185,129,0.6)'
  },
  {
    id: 'merchant',
    name: 'NUPS POS',
    number: '#3',
    position: 'Merchant',
    series: 'Every transaction leaves a verifiable trail',
    team: 'GlyphLock',
    frontImage: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/2c9739592_b202e0a1-0d37-4928-b2f5-5647a476b026.jpg',
    bindingType: 'MERCHANT_BINDING',
    bindingDate: '2025-03-01T16:45:00Z',
    covenant: 'Master Covenant',
    quote: 'No ghost charges, no lost payouts, every shift auditable.',
    binding: {
      method: 'Protected: in-venue payments, dancer payouts, tip streams, and receipts.',
      mechanism: 'Bound via: dynamic QR vouchers + NUPS ledger + Master Covenant terms.',
      protocol: 'Result: No ghost charges, no lost payouts, every shift auditable.'
    },
    cryptoSignature: {
      algorithm: 'ED25519',
      hash: 'e5fa44f2b31c1fb553b6021e7360d07d5d91ff5e',
      publicKey: '0x9E4f...2B7c',
      timestamp: 1740852300,
      verified: true
    },
    stats: { logic: 94, security: 97, creativity: 91, speed: 96 },
    borderColor: 'from-cyan-500 via-blue-400 to-cyan-500',
    glowColor: 'rgba(34,211,238,0.6)'
  },
  {
    id: 'creator',
    name: 'Creator',
    number: '#4',
    position: 'Artists, Devs, Writers, Engineers',
    series: 'Work is logged, bound, and credited',
    team: 'GlyphLock',
    frontImage: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/be936400a_2dcae465-c2a0-4301-940f-400933d21ebd.jpg',
    bindingType: 'CREATOR_BINDING',
    bindingDate: '2025-04-01T11:20:00Z',
    covenant: 'Master Covenant',
    quote: 'If it\'s scanned, its origin and rights are provable.',
    binding: {
      method: 'Protected: art, code, media, and concept proofs.',
      mechanism: 'Bound via: glyph-signed timestamps and CAB auto-binding.',
      protocol: 'Result: If it\'s scanned, its origin and rights are provable.'
    },
    cryptoSignature: {
      algorithm: 'ECDSA-P256',
      hash: '7c3b8f2e1d4a5b6c9e8f7a6b5c4d3e2f1a0b9c8d',
      publicKey: '0x5C8d...1F3e',
      timestamp: 1743444000,
      verified: true
    },
    stats: { logic: 92, security: 90, creativity: 99, speed: 95 },
    borderColor: 'from-violet-500 via-purple-400 to-fuchsia-400',
    glowColor: 'rgba(168,60,255,0.6)'
  }
];

export default function DreamTeamHero() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden" style={{ background: 'transparent', pointerEvents: 'auto' }}>
      {/* Animated grid overlay - INDIGO GLOW */}
      <div 
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(87,61,255,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(87,61,255,0.6) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <Badge className="mb-6 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-white border-white/20 px-6 py-2 text-sm backdrop-blur-md shadow-[0_0_30px_rgba(87,61,255,0.4)]">
            <Trophy className="w-4 h-4 mr-2 text-amber-400" />
            GlyphLock Archetypes
          </Badge>
          
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tight">
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(87,61,255,0.7)]">
              Protected Archetypes
            </span>
          </h2>
          
          <p className="text-lg md:text-xl text-violet-200 max-w-2xl mx-auto leading-relaxed mb-6">
            Four personas bound by the Master Covenant — from founders to creators, every role is secured and traceable.
          </p>

          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2 text-sm text-indigo-200">
              <Lock className="w-4 h-4 text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              <span>Verified Signatures</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-indigo-200">
              <Shield className="w-4 h-4 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              <span>BPAAA v3.0 Governed</span>
            </div>
          </div>
        </div>

        {/* Cards Grid - FULLSCREEN MOBILE SNAP SCROLL */}
        <div className="max-w-7xl mx-auto mb-12 px-4 md:snap-none snap-y snap-mandatory md:overflow-visible overflow-y-auto md:h-auto">
          {/* Card 1 - Founder */}
          <div className="flex justify-center items-center md:min-h-0 min-h-[90vh] snap-start mb-8 md:mb-10">
            <HeroHolographicCard card={DREAM_TEAM[0]} size="large" />
          </div>

          {/* Card 2 - Enterprise */}
          <div className="flex justify-center items-center md:min-h-0 min-h-[90vh] snap-start mb-8 md:mb-10">
            <HeroHolographicCard card={DREAM_TEAM[1]} size="large" />
          </div>

          {/* Card 3 - Merchant */}
          <div className="flex justify-center items-center md:min-h-0 min-h-[90vh] snap-start mb-8 md:mb-10">
            <HeroHolographicCard card={DREAM_TEAM[2]} size="large" />
          </div>

          {/* Card 4 - Creator */}
          <div className="flex justify-center items-center md:min-h-0 min-h-[90vh] snap-start">
            <HeroHolographicCard card={DREAM_TEAM[3]} size="large" />
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            to={createPageUrl('DreamTeam')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg hover:from-indigo-500 hover:to-violet-500 transition-all hover:scale-105 shadow-[0_0_45px_rgba(87,61,255,0.5),0_0_85px_rgba(87,61,255,0.25)]"
          >
            View Full Roster & Stats
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}