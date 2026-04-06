import React from 'react';

export default function GlyphLoader({ fullScreen = true, text = "Securing..." }) {
  const containerClass = fullScreen
    ? "fixed inset-0 z-[9999] flex items-center justify-center bg-black"
    : "relative w-full min-h-[200px] flex items-center justify-center";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-5">
        {/* Single SVG arc spinner — GPU-friendly, no blur */}
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none"
          style={{ animation: 'gl-spin 0.9s linear infinite' }}>
          <circle cx="30" cy="30" r="24" stroke="#1a1a2e" strokeWidth="5" />
          <path d="M30 6 A24 24 0 0 1 54 30" stroke="url(#gl-g)" strokeWidth="5" strokeLinecap="round" />
          <defs>
            <linearGradient id="gl-g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E4FF" />
              <stop offset="100%" stopColor="#8C4BFF" />
            </linearGradient>
          </defs>
        </svg>

        <p className="text-xs font-bold tracking-widest text-cyan-400 uppercase">{text}</p>

        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400"
              style={{ animation: `gl-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes gl-spin { to { transform: rotate(360deg); } }
        @keyframes gl-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

export function SectionLoader({ text = "Loading..." }) {
  return <GlyphLoader fullScreen={false} text={text} />;
}