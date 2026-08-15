import React from "react";
import { Shield, Lock, Zap } from "lucide-react";

export default function LoadingSpinner({ message = "Loading...", size = "default" }) {
  const sizes = {
    sm: { container: "w-24 h-24", logo: "w-6 h-6", text: "text-xs" },
    default: { container: "w-32 h-32", logo: "w-10 h-10", text: "text-sm" },
    lg: { container: "w-48 h-48", logo: "w-16 h-16", text: "text-lg" }
  };

  const currentSize = sizes[size];

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8">
      <div className={`relative ${currentSize.container}`}>
        {/* Outer hexagon rotating fast */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="w-full h-full border-4 border-transparent border-t-blue-500 border-r-blue-400" 
               style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
        </div>

        {/* Second ring rotating reverse */}
        <div className="absolute inset-2 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
          <div className="w-full h-full rounded-full border-4 border-transparent border-l-blue-600 border-b-cyan-500 shadow-lg shadow-blue-500/50" />
        </div>

        {/* Third ring with pulse */}
        <div className="absolute inset-4 animate-pulse">
          <div className="w-full h-full rounded-full border-2 border-blue-400/60 shadow-lg shadow-cyan-500/50" />
        </div>

        {/* Fourth spinning ring */}
        <div className="absolute inset-5 animate-spin" style={{ animationDuration: '4s' }}>
          <div className="w-full h-full rounded-full border-4 border-transparent border-t-cyan-400 border-r-blue-300" />
        </div>

        {/* Orbiting particles */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '5s' }}>
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/80 -translate-x-1/2" />
          <div className="absolute top-1/2 right-0 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/80 -translate-y-1/2" />
          <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-blue-600 rounded-full shadow-lg shadow-blue-600/80 -translate-x-1/2" />
          <div className="absolute top-1/2 left-0 w-2 h-2 bg-blue-300 rounded-full shadow-lg shadow-blue-300/80 -translate-y-1/2" />
        </div>

        {/* Central core with icons */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${currentSize.logo} relative`}>
            {/* Pulsing background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full blur-xl animate-pulse opacity-60" />
            
            {/* Icon container */}
            <div className="relative bg-gradient-to-br from-blue-600 to-cyan-700 rounded-full flex items-center justify-center shadow-2xl border-2 border-blue-400/50 w-full h-full">
              {/* Rotating icons */}
              <div className="absolute inset-0 flex items-center justify-center animate-spin" style={{ animationDuration: '6s' }}>
                <Shield className="w-full h-full p-2 text-white drop-shadow-lg" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                <Lock className="w-2/3 h-2/3 text-cyan-200 drop-shadow-lg" />
              </div>
            </div>

            {/* Corner accents */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
          </div>
        </div>

        {/* Outer glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-2xl animate-pulse" />
      </div>

      {message && (
        <div className="text-center space-y-4">
          <p className={`${currentSize.text} font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-pulse`}>
            {message}
          </p>
          
          {/* Animated dots */}
          <div className="flex gap-2 justify-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg shadow-blue-500/50" style={{ animationDelay: '0ms' }} />
            <span className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce shadow-lg shadow-cyan-400/50" style={{ animationDelay: '150ms' }} />
            <span className="w-3 h-3 bg-blue-600 rounded-full animate-bounce shadow-lg shadow-blue-600/50" style={{ animationDelay: '300ms' }} />
          </div>

          {/* Progress bar effect */}
          <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 animate-pulse" 
                 style={{ 
                   width: '100%',
                   animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, shimmer 2s linear infinite'
                 }} />
          </div>

          {/* Matrix-style text */}
          <div className="flex gap-1 justify-center font-mono text-xs text-cyan-400/60 animate-pulse">
            {['[', '●', '●', '●', '●', '●', '●', '●', ']'].map((char, i) => (
              <span key={i} style={{ animationDelay: `${i * 100}ms` }} className="animate-pulse">
                {char}
              </span>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}