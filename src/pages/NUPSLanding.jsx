import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";

export default function NUPSLanding() {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate('/NUPSGateway');
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* Particle animation background */}
      <div className="absolute inset-0 opacity-50">
        <div className="w-full h-full" style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(0, 228, 255, 0.1), transparent)',
          animation: 'pulse 8s ease-in-out infinite'
        }} />
        <div className="w-full h-full" style={{
          background: 'radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.1), transparent)',
          animation: 'pulse 10s ease-in-out infinite 2s'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 px-6">
        <h1 className="text-6xl md:text-8xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            N.U.P.S.
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-blue-300 font-medium">
          Next Universal Platform System
        </p>

        <button
          onClick={handleEnter}
          onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
          className="mt-12 px-12 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold text-lg rounded-lg hover:scale-105 transition-transform shadow-lg hover:shadow-cyan-500/50 flex items-center justify-center gap-2 mx-auto"
        >
          <Play size={24} />
          Enter System
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}