import React, { useState, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Shield, Zap, Fingerprint, Lock, Hash, Clock } from 'lucide-react';

/**
 * Premium Holographic Trading Card with Foil Effects
 * Used for Dream Team hero display
 */
export default function HeroHolographicCard({ card, size = 'normal' }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({});
  const cardRef = useRef(null);

  if (!card) return null;

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current || isFlipped) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const tiltX = (y - 0.5) * 15;
    const tiltY = (x - 0.5) * -15;
    const glareX = x * 100;
    const glareY = y * 100;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`,
      '--glare-x': `${glareX}%`,
      '--glare-y': `${glareY}%`,
    });
  }, [isFlipped]);

  const handleMouseLeave = useCallback(() => {
    setTiltStyle({});
    // Keep flip state on mouse leave - user must click to toggle
  }, []);

  const handleClick = useCallback(() => {
    setIsFlipped(prev => !prev);
    setTiltStyle({});
  }, []);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  const sizeClasses = {
    small: 'w-52 md:w-64',
    normal: 'w-64 md:w-80',
    large: 'w-80 md:w-96',
    hero: 'w-96 md:w-[28rem]',
    xl: 'w-[22rem] md:w-[26rem]'
  };

  return (
    <div
      ref={cardRef}
      className={`relative ${sizeClasses[size]} cursor-pointer group select-none`}
      style={{ 
        perspective: '1200px',
        filter: 'brightness(1.15) saturate(1.2)',
        transition: 'filter 0.6s ease-out'
      }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div
        className="relative w-full aspect-[3/4]"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : (tiltStyle.transform || 'rotateY(0deg)'),
          transition: isFlipped ? 'transform 0.6s ease-in-out' : 'transform 0.15s ease-out',
          willChange: 'transform',
          boxShadow: '0 0 50px rgba(87, 61, 255, 0.4)',
          ...(!isFlipped ? tiltStyle : {})
        }}
      >
        {/* ══════════════════════════════════════════════════════════
            FRONT - Holographic Trading Card
            ══════════════════════════════════════════════════════════ */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {/* Foil border effect */}
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.borderColor} p-[3px]`}
            style={{
              boxShadow: `0 0 50px ${card.glowColor}, 0 0 80px rgba(87, 61, 255, 0.3), inset 0 0 30px rgba(255,255,255,0.15)`
            }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-violet-950/40 to-blue-950/60" />
          </div>

          {/* Card image */}
          <img
            src={card.frontImage}
            alt={card.name}
            className="absolute inset-0 w-full h-full object-cover rounded-2xl"
            loading="lazy"
          />

          {/* Holographic shimmer overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
            style={{
              background: `
                linear-gradient(
                  105deg,
                  transparent 40%,
                  rgba(255, 255, 255, 0.2) 45%,
                  rgba(255, 255, 255, 0.3) 50%,
                  rgba(255, 255, 255, 0.2) 55%,
                  transparent 60%
                )
              `,
              backgroundPosition: `var(--glare-x, 50%) var(--glare-y, 50%)`,
              backgroundSize: '200% 200%'
            }}
          />

          {/* Diagonal foil highlights */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none rounded-2xl overflow-hidden"
            style={{
              background: `
                linear-gradient(
                  135deg,
                  transparent 0%,
                  rgba(244, 114, 182, 0.1) 25%,
                  rgba(6, 182, 212, 0.15) 50%,
                  rgba(168, 85, 247, 0.1) 75%,
                  transparent 100%
                )
              `
            }}
          />

          {/* Verified badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 border border-green-400/50 backdrop-blur-md shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            <span className="text-[10px] text-green-300 font-bold uppercase tracking-wider">Bound</span>
          </div>

          {/* Player number overlay */}
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
            <span className="text-lg font-black text-white">{card.number}</span>
          </div>

          {/* Nebula core glow */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: `radial-gradient(circle at 50% 80%, ${card.glowColor} 0%, transparent 50%)`,
              opacity: 0.4
            }}
          />
        </div>

        {/* ══════════════════════════════════════════════════════════
            BACK - Cryptographic Binding Details
            ══════════════════════════════════════════════════════════ */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            boxShadow: `0 0 50px ${card.glowColor}`
          }}
        >
          {/* Border */}
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.borderColor} p-[3px]`}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-violet-950/40 to-blue-950/60" />
          </div>

          {/* Content */}
          <div className="absolute inset-[3px] rounded-2xl bg-gradient-to-br from-indigo-950/40 via-violet-950/30 to-indigo-950/40 p-4 flex flex-col overflow-hidden" style={{ backdropFilter: 'blur(12px)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{card.name}</h3>
                  <p className="text-[10px] text-indigo-200">{card.position} • {card.number}</p>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-[9px] shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                ✓ VERIFIED
              </Badge>
            </div>

            {/* Binding Type */}
            <div className="bg-gradient-to-r from-fuchsia-500/15 via-cyan-500/10 to-fuchsia-500/15 border border-fuchsia-400/40 rounded-xl px-3 py-2 mb-3 shadow-[inset_0_0_20px_rgba(244,114,182,0.1)]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-fuchsia-400" />
                <span className="text-xs font-bold text-fuchsia-300 uppercase tracking-wider">{card.bindingType}</span>
              </div>
              <p className="text-[10px] text-violet-200 mt-1">{card.covenant}</p>
            </div>

            {/* Binding Details */}
            <div className="space-y-2 mb-3">
              {[card.binding?.method, card.binding?.mechanism, card.binding?.protocol].filter(Boolean).map((text, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-violet-100 leading-tight">{text}</p>
                </div>
              ))}
            </div>

            {/* Quote */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 mb-3 backdrop-blur-sm">
              <p className="text-[9px] italic text-cyan-300/80 leading-relaxed">"{card.quote}"</p>
            </div>

            {/* Crypto Signature Block */}
            <div className="flex-1 bg-black/70 border border-cyan-500/40 rounded-xl p-3 font-mono shadow-[inset_0_0_30px_rgba(6,182,212,0.05)]">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-cyan-500/30">
                <Fingerprint className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">Cryptographic Signature</span>
              </div>

              <div className="space-y-1.5 text-[9px]">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-300">Algorithm:</span>
                  <span className="text-green-400 font-semibold">{card.cryptoSignature?.algorithm}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Hash className="w-3 h-3 text-indigo-300 flex-shrink-0 mt-0.5" />
                  <span className="text-fuchsia-300 break-all leading-tight">{card.cryptoSignature?.hash?.slice(0, 24)}...</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-indigo-300" />
                  <span className="text-cyan-300">{card.cryptoSignature?.publicKey}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-indigo-300" />
                  <span className="text-violet-200">{formatDate(card.bindingDate)}</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-cyan-500/30 flex items-center justify-between">
                <span className="text-[8px] text-indigo-300 uppercase">Status</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                  <span className="text-[9px] text-green-400 font-bold">VERIFIED & BOUND</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-[0_0_10px_rgba(244,114,182,0.5)]">
                  <span className="text-[7px] font-black text-white">GL</span>
                </div>
                <span className="text-[9px] text-indigo-200 uppercase tracking-wider">GlyphLock</span>
              </div>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 text-[8px] shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                BPAA CERTIFIED
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}