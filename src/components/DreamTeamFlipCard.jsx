// GLYPHLOCK DREAM TEAM HARD-LOCK
// This file is the canonical Dream Team flip card component.
// Do not replace this with archetype cards, shadcn defaults, or placeholder cards.
// Any change to this file MUST be explicitly requested by Carlo Rene Earl.

import React, { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, Lock, Fingerprint, Hash, Clock, Zap } from "lucide-react";

export default function DreamTeamFlipCard({ card }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  if (!card) return null;

  const handleClick = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div 
      className="relative w-full h-full cursor-pointer group select-none"
      style={{ perspective: '1200px' }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div 
        className="relative w-full h-full"
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.6s ease-in-out',
          willChange: 'transform'
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════
            FRONT OF CARD - Basketball Trading Card Image
            ═══════════════════════════════════════════════════════════════ */}
        <div 
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            boxShadow: `0 0 50px ${card.glowColor}, 0 0 80px rgba(87,61,255,0.3)`
          }}
        >
          {/* Holographic border gradient */}
          <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${card.borderColor} p-[3px]`}>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-violet-950/30 to-blue-950/40 backdrop-blur-md" />
          </div>

          {/* Card image */}
          <img 
            src={card.frontImage} 
            alt={card.name}
            className={`absolute inset-0 w-full h-full object-cover rounded-3xl transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-violet-950 animate-pulse rounded-3xl" />
          )}

          {/* Holographic shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] pointer-events-none" 
            style={{ transition: 'transform 1s ease-out, opacity 0.3s' }} 
          />

          {/* Verified badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-400/50 backdrop-blur-md shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-300 font-semibold uppercase tracking-wider">Bound</span>
          </div>
          
          {/* Tap indicator mobile */}
          <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg text-xs text-white font-medium shadow-[0_0_20px_rgba(87,61,255,0.3)]">
            Tap to flip
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BACK OF CARD - Cryptographic Binding Details
            ═══════════════════════════════════════════════════════════════ */}
        <div 
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            boxShadow: `0 0 50px ${card.glowColor}, 0 0 80px rgba(87,61,255,0.3)`
          }}
        >
          {/* Border gradient */}
          <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${card.borderColor} p-[3px]`}>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-violet-950/30 to-blue-950/40 backdrop-blur-md" />
          </div>

          {/* Content - NO GREY TINT, BLUE-VIOLET GLASS */}
          <div className="absolute inset-[3px] rounded-3xl bg-[rgba(10,10,30,0.6)] backdrop-blur-xl p-4 md:p-6 flex flex-col overflow-hidden border border-indigo-400/30 shadow-[inset_0_0_40px_rgba(87,61,255,0.2),0_0_30px_rgba(59,130,246,0.3)]">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(87,61,255,0.4)]">
                  <Shield className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white">{card.name}</h3>
                  <p className="text-xs text-indigo-200">{card.position} • {card.number}</p>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs px-2 py-1 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                ✓ VERIFIED
              </Badge>
            </div>

            {/* Binding Type Banner - ENHANCED GLOW */}
            <div className="bg-gradient-to-r from-indigo-500/25 via-violet-500/20 to-fuchsia-500/25 border-2 border-indigo-400/50 rounded-xl px-3 py-2 mb-3 shadow-[inset_0_0_25px_rgba(87,61,255,0.15),0_0_20px_rgba(129,140,248,0.2)]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-300" />
                <span className="text-xs font-bold text-violet-200 uppercase tracking-wider">{card.bindingType}</span>
              </div>
              <p className="text-xs text-indigo-200 mt-1">{card.covenant}</p>
            </div>

            {/* Binding Details */}
            <div className="space-y-2 mb-3 flex-shrink-0">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-300 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white leading-tight">{card.binding?.method}</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-300 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white leading-tight">{card.binding?.mechanism}</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-300 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white leading-tight">{card.binding?.protocol}</p>
              </div>
            </div>

            {/* Quote - NO GREY, BLUE GLASS */}
            <div className="bg-indigo-500/10 border-2 border-indigo-400/40 rounded-xl p-3 mb-3 backdrop-blur-md shadow-[inset_0_0_20px_rgba(87,61,255,0.15),0_0_15px_rgba(59,130,246,0.2)]">
              <p className="text-xs italic text-indigo-200 leading-relaxed">"{card.quote}"</p>
            </div>

            {/* CRYPTOGRAPHIC SIGNATURE BLOCK - BLUE VIOLET GLOW */}
            <div className="flex-1 bg-indigo-950/40 border-2 border-indigo-400/40 rounded-xl p-3 font-mono overflow-y-auto backdrop-blur-md shadow-[inset_0_0_35px_rgba(87,61,255,0.2),0_0_25px_rgba(59,130,246,0.25)]">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-indigo-400/30">
                <Fingerprint className="w-4 h-4 text-indigo-300" />
                <span className="text-xs text-indigo-200 font-bold uppercase tracking-wider">Cryptographic Signature</span>
              </div>
              
              {card.cryptoSignature?.asciiArt ? (
                <pre className="text-[7px] md:text-[8px] text-green-400 leading-tight whitespace-pre overflow-x-auto">
{card.cryptoSignature.asciiArt}
                </pre>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-violet-200">Algorithm:</span>
                    <span className="text-green-400 font-semibold">{card.cryptoSignature?.algorithm}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Hash className="w-3 h-3 text-violet-200 flex-shrink-0 mt-0.5" />
                    <span className="text-fuchsia-300 break-all leading-tight">{card.cryptoSignature?.hash}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-violet-200" />
                    <span className="text-indigo-300">{card.cryptoSignature?.publicKey}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-violet-200" />
                    <span className="text-white">{formatDate(card.bindingDate)}</span>
                  </div>
                </div>
              )}

              {/* Verification status */}
              <div className="mt-3 pt-2 border-t border-indigo-400/30 flex items-center justify-between">
                <span className="text-xs text-violet-200 uppercase">Status</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                  <span className="text-xs text-green-400 font-bold">VERIFIED & BOUND</span>
                </div>
              </div>
            </div>

            {/* Footer seal */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-[0_0_10px_rgba(87,61,255,0.5)]">
                  <span className="text-[8px] font-black text-white">GL</span>
                </div>
                <span className="text-xs text-indigo-200 uppercase tracking-wider font-medium">GlyphLock</span>
              </div>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 text-xs px-2 py-1 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                BPAA CERTIFIED
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}