import React from 'react';

export default function GlyphLoader({ fullScreen = true, text = "Securing..." }) {
  const containerClass = fullScreen 
    ? "fixed inset-0 z-[9999] flex items-center justify-center bg-black"
    : "relative w-full h-full min-h-[200px] flex items-center justify-center bg-black/50 rounded-xl";

  return (
    <div className={containerClass}>
      {/* Quantum particles background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00E4FF]/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8C4BFF]/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#9F00FF]/10 rounded-full blur-[100px] animate-ping" />
      </div>

      {/* Main loader */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Hexagonal glyph loader */}
        <div className="relative w-40 h-40">
          {/* Outer rotating hexagon */}
          <svg className="absolute inset-0 w-40 h-40 animate-spin-slow" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="hexGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#00E4FF', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#8C4BFF', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <polygon 
              points="80,10 130,40 130,100 80,130 30,100 30,40"
              fill="none"
              stroke="url(#hexGrad1)"
              strokeWidth="3"
              strokeDasharray="10 5"
              className="animate-dash"
            />
          </svg>

          {/* Middle pulsing hexagon */}
          <svg className="absolute inset-0 w-40 h-40 animate-pulse-slow" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="hexGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#9F00FF', stopOpacity: 0.6 }} />
                <stop offset="100%" style={{ stopColor: '#00E4FF', stopOpacity: 0.6 }} />
              </linearGradient>
            </defs>
            <polygon 
              points="80,25 115,47.5 115,92.5 80,115 45,92.5 45,47.5"
              fill="none"
              stroke="url(#hexGrad2)"
              strokeWidth="2"
            />
          </svg>

          {/* Inner rotating glyphs */}
          <div className="absolute inset-0 flex items-center justify-center animate-spin-reverse">
            <svg className="w-24 h-24" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="glyphGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#00E4FF', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#9F00FF', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#8C4BFF', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              {/* Custom glyph symbols */}
              <circle cx="50" cy="20" r="3" fill="url(#glyphGrad)" className="animate-pulse" />
              <circle cx="80" cy="35" r="3" fill="url(#glyphGrad)" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
              <circle cx="80" cy="65" r="3" fill="url(#glyphGrad)" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
              <circle cx="50" cy="80" r="3" fill="url(#glyphGrad)" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
              <circle cx="20" cy="65" r="3" fill="url(#glyphGrad)" className="animate-pulse" style={{ animationDelay: '0.8s' }} />
              <circle cx="20" cy="35" r="3" fill="url(#glyphGrad)" className="animate-pulse" style={{ animationDelay: '1s' }} />
              
              {/* Center glyph */}
              <path 
                d="M 45 45 L 55 45 L 55 40 L 60 50 L 55 60 L 55 55 L 45 55 L 45 60 L 40 50 L 45 40 Z"
                fill="url(#glyphGrad)"
                className="animate-pulse-fast"
              />
            </svg>
          </div>

          {/* Center glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00E4FF]/40 to-[#9F00FF]/40 rounded-full blur-xl animate-pulse-fast" />
          </div>
        </div>

        {/* Loading text with glow */}
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-[#00E4FF] via-[#9F00FF] to-[#8C4BFF] bg-clip-text animate-gradient">
            {text}
          </h2>
          
          {/* Quantum dots */}
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] animate-bounce-stagger"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>

        {/* Quantum scan line */}
        <div className="relative w-72 h-0.5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00E4FF] to-transparent animate-scan-quantum" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#9F00FF] to-transparent animate-scan-quantum-reverse" />
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        @keyframes pulse-fast {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes dash {
          to { stroke-dashoffset: -100; }
        }

        @keyframes bounce-stagger {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
        }

        @keyframes scan-quantum {
          0%, 100% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(200%); opacity: 0; }
        }

        @keyframes scan-quantum-reverse {
          0%, 100% { transform: translateX(200%); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateX(-100%); opacity: 0; }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-spin-slow { animation: spin-slow 4s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 6s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-pulse-fast { animation: pulse-fast 1.5s ease-in-out infinite; }
        .animate-dash { animation: dash 2s linear infinite; }
        .animate-bounce-stagger { animation: bounce-stagger 1.4s ease-in-out infinite; }
        .animate-scan-quantum { animation: scan-quantum 3s ease-in-out infinite; }
        .animate-scan-quantum-reverse { animation: scan-quantum-reverse 3s ease-in-out infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

// Section loader variant
export function SectionLoader({ text = "Loading..." }) {
  return <GlyphLoader fullScreen={false} text={text} />;
}