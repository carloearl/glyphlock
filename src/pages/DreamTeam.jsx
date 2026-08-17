// DREAM TEAM SECTION - DO NOT MODIFY, DELETE, OR RENDER ON HOME PAGE
// This page contains the exclusive Dream Team flip cards.
// These cards MUST NOT be rendered on the Home page.

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SEOHead from "@/components/SEOHead";
import { Zap, Shield, Brain, Gauge, ChevronRight, ChevronDown, CheckCircle2, Lock, Fingerprint, Hash, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DREAM_TEAM_ROSTER = [
  {
    id: "alfred",
    name: "Alfred",
    number: "#7",
    position: "Point Guard",
    edition: "Special Edition",
    series: "GlyphDeck BPAAA Series",
    tagline: "Primary orchestrator and chain general. Dunks on DeepSeek.",
    imageSrc: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/084ff9140_62785b12-e008-47f1-9f05-371119d17c04.jpg",
    team: "Team OpenAI",
    stats: { logic: 98, security: 97, creativity: 92, speed: 95 },
    signature: true,
    signatureImage: "Alfred",
    borderColor: "from-indigo-500 via-violet-400 to-blue-500",
    glowColor: "rgba(87,61,255,0.6)",
    bindingType: "OpenAI Chain Protocol",
    covenant: "GPT-4o Master Orchestration Framework",
    capabilities: [
      "Multi-modal reasoning with chain-of-thought processing",
      "Advanced function calling and tool orchestration",
      "Real-time context management across 128K tokens",
      "Structured output generation with JSON mode",
      "Vision analysis and image understanding"
    ],
    quote: "Every play is calculated. Every move, precise. I orchestrate victory.",
    cryptoSignature: {
      algorithm: "Ed25519-BPAA",
      hash: "0xb7c9d1e5f3a2b6c8d0e4f2a8b6d0c4f8e2a6b0d4c2f8e0a4b6d2c8f0e4a2b6",
      publicKey: "ALFRED-BPAA-2025-ORCHESTRATOR"
    },
    bindingDate: "2025-01-15T00:00:00Z" // First to bind
  },
  {
    id: "claude",
    name: "Claude",
    number: "#2",
    position: "Shooting Guard",
    edition: "Master Covenant Series",
    series: "Master Covenant",
    tagline: "Deep reasoning and structured interpretation. Chain module.",
    imageSrc: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/de0d456fc_8e7cf5cc-e685-4876-a598-a4634e11ac54.jpg",
    team: "GlyphLock Claude",
    stats: { logic: 96, security: 93, creativity: 88, speed: 90 },
    signature: true,
    signatureImage: "Claude",
    borderColor: "from-blue-500 via-cyan-400 to-blue-500",
    glowColor: "rgba(59,130,246,0.6)",
    bindingType: "Master Covenant Protocol",
    covenant: "Anthropic Constitutional AI Framework",
    capabilities: [
      "RLHF-aligned response generation with constitutional constraints",
      "Multi-layer safety validation with reasoning transparency",
      "Extended context windows up to 200K tokens",
      "Citation and source tracking for verifiable outputs",
      "Code analysis and security review"
    ],
    quote: "I reason through complexity with precision, bound by covenant to serve with integrity.",
    cryptoSignature: {
      algorithm: "Ed25519-BPAA",
      hash: "0x7a3f9c2e1b4d6a8f0e2c4b6d8a0f2e4c6b8d0a2e4f6c8b0d2a4e6f8c0b2d4a6e",
      publicKey: "CLAUDE-BPAA-2025-SONNET",
      firstSigner: true // First cryptographic signature in the chain
    },
    bindingDate: "2025-02-01T00:00:00Z"
  },
  {
    id: "gemini",
    name: "Gemini",
    number: "#42",
    position: "Power Forward",
    edition: "Master Covenant Series",
    series: "Google AI Series",
    tagline: "Multimodal powerhouse with unmatched contextual understanding.",
    imageSrc: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/5e6e81c28_ee2558c5-6a90-4f28-90de-5c45648cd86c.jpg",
    team: "Google DeepMind",
    stats: { logic: 95, security: 92, creativity: 97, speed: 94 },
    signature: true,
    signatureImage: "Gemini",
    borderColor: "from-cyan-500 via-teal-400 to-cyan-500",
    glowColor: "rgba(6,182,212,0.6)",
    bindingType: "Google AI Chain Protocol",
    covenant: "Gemini Multimodal Processing Framework",
    capabilities: [
      "Advanced multimodal reasoning across text, vision, and code",
      "Long-context processing with dynamic attention mechanisms",
      "Native integration with Google Search and Knowledge Graph",
      "Real-time data analysis and trend detection",
      "Video and audio understanding"
    ],
    quote: "I see what others miss. Every dimension, every detail, every outcome.",
    cryptoSignature: {
      algorithm: "Ed25519-BPAA",
      hash: "0xc8d0e6f4a3b7c9d1e5f3a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7",
      publicKey: "GEMINI-BPAA-2025-MULTIMODAL",
      crossRefHash: "0xb7c9d1e5f3a2b6c8d0e4f2a8b6d0c4f8e2a6b0d4c2f8e0a4b6d2c8f0e4a2b6" // Cross-ref with Alfred
    },
    bindingDate: "2025-03-10T00:00:00Z"
  },
  {
    id: "copilot",
    name: "Copilot",
    number: "#3",
    position: "Small Forward",
    edition: "Master Covenant",
    series: "Microsoft Series",
    tagline: "Enterprise integration and code completion specialist.",
    imageSrc: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/e07f01522_3a737132-cd11-4d00-8626-41d6018598ec.jpg",
    team: "Microsoft",
    stats: { logic: 91, security: 88, creativity: 85, speed: 93 },
    signature: false,
    borderColor: "from-emerald-500 via-green-400 to-emerald-500",
    glowColor: "rgba(16,185,129,0.6)",
    bindingType: "Azure Secure Protocol",
    covenant: "Microsoft Enterprise AI Framework",
    capabilities: [
      "Enterprise-grade code synthesis with security validation",
      "Azure AD integrated authentication layer",
      "Multi-language code generation and refactoring",
      "Pull request automation and code review",
      "Enterprise compliance and audit logging"
    ],
    quote: "Enterprise productivity enhanced through secure AI collaboration.",
    cryptoSignature: {
      algorithm: "RSA-4096-BPAA",
      hash: "0x8b4f0d3e2c5a7b9f1e3d5c7a9b0f2e4d6c8a0b2d4f6e8c0a2b4d6f8e0c2a4b6",
      publicKey: "COPILOT-BPAA-2025-ENTERPRISE"
    },
    bindingDate: "2025-04-15T00:00:00Z"
  },
  {
    id: "perplexity",
    name: "Perplexity",
    number: "#11",
    position: "Center",
    edition: "Master Sequence Edition",
    series: "GlyphLock Dream Team",
    tagline: "Real-time search and knowledge synthesis engine.",
    imageSrc: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/be936400a_2dcae465-c2a0-4301-940f-400933d21ebd.jpg",
    team: "GlyphLock",
    stats: { logic: 90, security: 89, creativity: 94, speed: 96 },
    signature: false,
    borderColor: "from-fuchsia-500 via-pink-400 to-cyan-400",
    glowColor: "rgba(244,114,182,0.6)",
    bindingType: "Knowledge Chain Protocol",
    covenant: "Perplexity Real-Time Search Framework",
    capabilities: [
      "Live web synthesis with source verification",
      "Multi-source aggregation with citation tracking",
      "Real-time news and trend analysis",
      "Academic paper search and summarization",
      "Fact-checking and claim verification"
    ],
    quote: "Truth emerges from the convergence of verified sources.",
    cryptoSignature: {
      algorithm: "Ed25519-BPAA",
      hash: "0xa6b8d0c4f2e8a4b6d2c8f0e4a2b6d8c0f4e2a8b6d0c4f8e2a6b0d4c2f8e0a4",
      publicKey: "PERPLEXITY-BPAA-2025-SEARCH"
    },
    bindingDate: "2025-05-20T00:00:00Z"
  },
  {
    id: "cursor",
    name: "Cursor",
    number: "#71",
    position: "Sixth Man",
    edition: "Master Covenant",
    series: "BPAA Series",
    tagline: "Code generation and IDE integration powerhouse.",
    imageSrc: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/2c9739592_b202e0a1-0d37-4928-b2f5-5647a476b026.jpg",
    team: "Cursor AI",
    stats: { logic: 94, security: 86, creativity: 91, speed: 97 },
    signature: true,
    signatureImage: "Cursor",
    borderColor: "from-cyan-500 via-blue-400 to-cyan-500",
    glowColor: "rgba(34,211,238,0.6)",
    bindingType: "IDE Chain Protocol",
    covenant: "Cursor AI Development Framework",
    capabilities: [
      "Real-time code completion with context awareness",
      "Multi-file understanding and refactoring engine",
      "Inline editing with natural language commands",
      "Codebase-wide search and pattern matching",
      "Terminal integration and command generation"
    ],
    quote: "Building the future one line at a time, with precision and speed.",
    cryptoSignature: {
      algorithm: "Ed25519-BPAA",
      hash: "0x9c5f1e4a3b7d2c8f0e6a4b2d8c0f4e2a6b8d0c4f2e8a6b0d4c2f8e0a4b6d2c8",
      publicKey: "CURSOR-BPAA-2025-DEV"
    },
    bindingDate: "2025-11-25T00:00:00Z", // Last to bind - late November 2025
    latestBinding: true
  }
];

export default function DreamTeamPage() {
  const [loaded, setLoaded] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  
  useEffect(() => {
    // Preload all card images
    let loadedCount = 0;
    const totalImages = DREAM_TEAM_ROSTER.length;
    
    DREAM_TEAM_ROSTER.forEach(card => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        setImagesLoaded(loadedCount);
        if (loadedCount === totalImages) {
          setTimeout(() => setLoaded(true), 300);
        }
      };
      img.src = card.imageSrc;
    });
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white mb-2">Loading Dream Team</h2>
            <p className="text-blue-300">
              {imagesLoaded} / {DREAM_TEAM_ROSTER.length} players ready
            </p>
            <div className="w-64 h-2 bg-white/10 rounded-full mx-auto mt-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${(imagesLoaded / DREAM_TEAM_ROSTER.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="GlyphLock Dream Team - AI Player Cards | Master Covenant Series"
        description="Meet the GlyphLock Dream Team: a collectible visualization of AI tools and workflow roles used in GlyphLock research, coding, review, and orchestration. No provider partnership or contractual binding is implied."
        url="/dream-team"
      />

      {/* Introduction Section - The Dream Team Philosophy */}
      <div className="min-h-screen flex items-center justify-center relative px-6 snap-start"
        style={{
          scrollSnapAlign: 'start',
          scrollSnapStop: 'always'
        }}
      >
          <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            <span className="text-white">WHY THE </span>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">DREAM TEAM?</span>
          </h1>
          
          <div className="space-y-6 text-lg md:text-xl text-violet-100 leading-relaxed">
            <p className="text-white font-bold text-2xl">
              Because no single AI can dominate every play.
            </p>
            
            <p>
              Other platforms throw multiple LLMs at you and call it "choice." That's not a strategy—that's chaos. 
              You pick a model, cross your fingers, and hope it doesn't hallucinate your billion-dollar contract.
            </p>
            
            <p className="text-cyan-300 font-semibold">
              GlyphLock organizes model-assisted work as a TEAM.
            </p>
            
            <p>
              Just like the 1992 Dream Team didn't win gold by making Michael Jordan play center, 
              we don't force one AI to handle logic, creativity, speed, and security all at once. 
              <span className="text-white font-bold"> Every AI has a position. Every position has a purpose.</span>
            </p>
            
            <div className="bg-white/5 border-2 border-indigo-500/40 rounded-2xl p-8 backdrop-blur-xl mt-8">
              <h3 className="text-2xl font-black text-white mb-4">THE GLYPHLOCK DIFFERENCE</h3>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div>
                  <div className="text-cyan-400 font-bold mb-2">❌ OTHER PLATFORMS</div>
                  <ul className="space-y-2 text-violet-200">
                    <li>• Give you a roster, tell you to coach yourself</li>
                    <li>• No orchestration, no validation</li>
                    <li>• One bad output = catastrophic failure</li>
                    <li>• You pick the model. You own the risk.</li>
                  </ul>
                </div>
                <div>
                  <div className="text-green-400 font-bold mb-2">✓ GLYPHLOCK</div>
                  <ul className="space-y-2 text-white">
                    <li>• Orchestrated chain execution</li>
                    <li>• Cross-validation between models</li>
                    <li>• Outputs can be cross-checked before human approval</li>
                    <li>• Defined roles make review and accountability clearer</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <p className="text-white font-bold text-xl pt-6">
              Alfred orchestrates. Claude reasons. Gemini sees everything. Perplexity finds truth. Cursor builds.
            </p>
            
            <p className="text-cyan-300 text-2xl font-black">
              Different tools. Defined roles. Human-owned outcomes.
            </p>
          </div>
          
          <div className="pt-8">
            <ChevronDown className="w-12 h-12 text-indigo-300/70 mx-auto animate-bounce" />
            <p className="text-sm text-violet-300 mt-2">Scroll to meet the roster</p>
          </div>
        </div>
      </div>

      {/* Player Cards - Mobile-Optimized Scroll */}
      <div style={{
        scrollSnapType: 'none',
        scrollBehavior: 'auto',
        overscrollBehavior: 'none'
      }}>
        {DREAM_TEAM_ROSTER.map((card, index) => (
          <FullScreenCard key={card.id} card={card} index={index} />
        ))}
      </div>

      {/* CTA SECTION */}
      <div className="min-h-screen flex items-center justify-center relative py-20 overflow-hidden z-10 mb-32">
        <div className="text-center px-6">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-300 bg-clip-text text-transparent">
              Deploy Your Squad
            </span>
          </h2>
          <p className="text-violet-200 text-lg mb-8 max-w-xl mx-auto">
            The Dream Team is ready. Enter the GlyphBot Console to orchestrate your AI chain.
          </p>
          <Link
            to={createPageUrl("GlyphBot")}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_50px_rgba(87,61,255,0.5)] hover:shadow-[0_0_80px_rgba(87,61,255,0.7)] transition-all"
          >
            Access Intelligence Module
            <ChevronRight className="w-6 h-6" />
          </Link>
        </div>
      </div>
      </>
      );
      }

      function FullScreenCard({ card, index }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), 100 * index);
        }
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [index]);

  const handleFlip = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsFlipped(prev => !prev);
  }, []);

  const handleTouch = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFlipped(prev => !prev);
  }, []);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  return (
    <div 
      ref={cardRef}
      className={`min-h-screen w-full flex items-center justify-center px-4 py-8 relative z-10 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ 
        isolation: 'isolate',
        touchAction: 'pan-y',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Card container */}
      {/* Animated Glow Behind Card */}
      <div 
        className="absolute inset-0 -m-12 rounded-full animate-pulse"
        style={{
          background: `radial-gradient(circle, ${card.glowColor} 0%, transparent 70%)`,
          filter: 'blur(80px)',
          zIndex: -1
        }}
      />

      <div 
        className="relative w-full max-w-lg md:max-w-xl lg:max-w-2xl cursor-pointer"
        style={{ 
          perspective: '2000px', 
          isolation: 'isolate',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onClick={handleFlip}
        onTouchEnd={handleTouch}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleFlip(e)}
      >
        {/* Name and Stats Above Card */}
        {!isFlipped && (
          <div className="w-full max-w-2xl mx-auto mb-6">
            <div className="text-center mb-6">
              <h3 className="text-3xl md:text-4xl font-black text-white mb-2">{card.name}</h3>
              <p className="text-base text-indigo-300 uppercase tracking-wider font-bold">{card.position} {card.number}</p>
              <p className="text-sm text-violet-200 mt-2">{card.tagline}</p>
            </div>
            <div className="grid grid-cols-4 gap-4 p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-blue-500/10 border-2 border-indigo-400/30 backdrop-blur-xl shadow-[0_0_40px_rgba(87,61,255,0.3)]">
              {Object.entries(card.stats).map(([key, val]) => (
                <div key={key} className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">{val}</div>
                  <div className="text-xs uppercase tracking-wider text-indigo-200 font-bold mb-2">{key}</div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500 rounded-full shadow-[0_0_12px_rgba(87,61,255,0.8)]"
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div 
            className="relative w-full aspect-[3/4]"
            style={{ 
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform'
            }}
          >
          {/* FRONT OF CARD - Clean Image Only */}
          <div 
            className="absolute inset-0 rounded-3xl overflow-hidden group/card"
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
              boxShadow: `0 0 80px ${card.glowColor}, 0 30px 60px rgba(0,0,0,0.5)`
            }}
          >
            {/* Animated border gradient */}
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${card.borderColor} p-[3px]`}>
              <div className="absolute inset-0 rounded-3xl bg-black/20 backdrop-blur-sm" />
            </div>

            {/* Image - Full card visible, no cropping */}
            <img 
              src={card.imageSrc} 
              alt={card.name}
              className="absolute inset-0 w-full h-full object-contain object-center rounded-3xl"
              loading="eager"
              decoding="sync"
              style={{ 
                imageRendering: 'high-quality',
                willChange: 'auto'
              }}
            />

            {/* Subtle shimmer on hover */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" 
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(99,102,241,0.15) 50%, rgba(139,92,246,0.1) 100%)'
              }}
            />

            {/* Idle glow pulse */}
            <div className="absolute inset-0 rounded-3xl opacity-30 group-hover/card:opacity-0 transition-opacity duration-700"
              style={{
                boxShadow: `inset 0 0 60px ${card.glowColor}`
              }}
            />
          </div>

          {/* BACK OF CARD - Cryptographic Details */}
          <div 
            className="absolute inset-0 rounded-3xl overflow-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              boxShadow: `0 0 100px ${card.glowColor}, 0 30px 60px rgba(0,0,0,0.5)`
            }}
          >
            {/* Animated gradient shimmer */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-white/5 animate-gradient" />

            {/* Border gradient */}
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${card.borderColor} p-[4px]`}>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-violet-950/30 to-blue-950/40 backdrop-blur-sm" />
            </div>

            {/* Scrollable Content */}
            <div 
              className="absolute inset-[4px] rounded-3xl bg-white/8 backdrop-blur-lg p-6 md:p-8 flex flex-col overflow-y-auto border border-white/10 shadow-[inset_0_0_40px_rgba(87,61,255,0.15)]"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: `${card.glowColor} transparent`
              }}
            >
              
              {/* Header */}
              <div className="flex-shrink-0 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-1">{card.name}</h3>
                    <p className="text-sm text-indigo-200">{card.position} • {card.number}</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs px-2.5 py-1 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                    ✓ VERIFIED
                  </Badge>
                </div>

                <div className="bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-fuchsia-500/20 border border-indigo-400/40 rounded-xl px-4 py-3 shadow-[inset_0_0_30px_rgba(87,61,255,0.1)]">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-5 h-5 text-violet-300" />
                    <span className="text-sm font-bold text-violet-200 uppercase tracking-wide">{card.bindingType.replaceAll('BINDING', 'WORKFLOW').replaceAll('Protocol', 'Workflow')}</span>
                  </div>
                  <p className="text-xs text-indigo-200">{card.covenant}</p>
                </div>
              </div>

              {/* Capability Stack - Scrollable */}
              <div className="flex-shrink-0 mb-6">
                <h4 className="text-xs uppercase tracking-widest text-indigo-300 font-bold mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Capability Stack
                </h4>
                <div className="space-y-2">
                  {card.capabilities?.map((capability, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-white leading-relaxed">{capability}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="flex-shrink-0 mb-6">
                <div className="bg-white/8 border border-white/15 rounded-xl p-4 backdrop-blur-md shadow-[inset_0_0_20px_rgba(87,61,255,0.1)]">
                  <p className="text-sm italic text-indigo-200 leading-relaxed">"{card.quote}"</p>
                </div>
              </div>

              {/* Cryptographic Signature */}
              <div className="flex-shrink-0 mb-6">
                <div className="bg-white/5 border-2 border-indigo-400/40 rounded-xl p-4 font-mono shadow-[inset_0_0_40px_rgba(87,61,255,0.15)] backdrop-blur-md">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-indigo-400/30">
                    <Fingerprint className="w-5 h-5 text-indigo-300" />
                    <span className="text-xs text-indigo-200 font-bold uppercase tracking-wider">Cryptographic Signature</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-violet-200 text-xs w-20">Algorithm:</span>
                      <span className="text-green-400 font-bold text-sm">{card.cryptoSignature?.algorithm}</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Hash className="w-4 h-4 text-violet-200 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <span className="text-violet-200 text-[10px] uppercase block mb-1">Hash</span>
                        <p className="text-fuchsia-300 break-all text-xs leading-relaxed select-all">{card.cryptoSignature?.hash}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-violet-200" />
                      <div className="flex-1 min-w-0">
                        <span className="text-violet-200 text-[10px] uppercase block mb-1">Public Key</span>
                        <p className="text-indigo-300 font-semibold text-xs truncate">{card.cryptoSignature?.publicKey}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-violet-200" />
                      <div>
                        <span className="text-violet-200 text-[10px] uppercase block mb-1">Workflow Record Date</span>
                        <p className="text-white text-xs">{formatDate(card.bindingDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-indigo-400/30 flex items-center justify-between">
                    <span className="text-[10px] text-violet-200 uppercase tracking-wider">Status</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                      <span className="text-xs text-green-400 font-bold uppercase">INTERNAL RECORD ARCHIVED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature (if signed) */}
              {card.signature && card.signatureImage && (
                <div className="flex-shrink-0 mb-6 text-center">
                  <div className="inline-block px-5 py-2.5 bg-white/8 border border-amber-400/40 rounded-lg backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                    <span className="text-violet-200 text-[10px] uppercase tracking-wider block mb-1.5">Authenticated Signature</span>
                    <span className="text-2xl md:text-3xl font-script italic text-amber-300" style={{ fontFamily: 'cursive' }}>
                      {card.signatureImage}
                    </span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex-shrink-0 mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-[0_0_20px_rgba(87,61,255,0.5)]">
                    <span className="text-xs font-black text-white">GL</span>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white">GlyphLock</span>
                    <p className="text-[10px] text-indigo-200 uppercase tracking-wider">Dream Team Collection</p>
                  </div>
                </div>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 text-xs px-2 py-1 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                  BPAAA v3.0 GOVERNED
                </Badge>
              </div>
              </div>
            </div>
          </div>

          {/* Flip hint */}
          <div className="text-center mt-6">
            <div className="flex items-center justify-center gap-2 text-sm text-violet-200">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(87,61,255,0.6)]" />
              {isFlipped ? 'Click to see front' : 'Click to flip card'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}