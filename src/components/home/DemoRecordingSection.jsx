import React, { useState } from "react";
import { motion } from "framer-motion";

export default function DemoRecordingSection() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="w-full flex justify-center px-4 sm:px-6 py-8">
      <div className="relative w-full max-w-[1200px]">
        <div className="text-center mb-6">
          <p className="text-xs sm:text-sm font-black tracking-[0.3em] uppercase text-blue-300">
            Live Walkthrough
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mt-2">
            See NUPS In Action
          </h2>
        </div>

        <div className="relative w-full rounded-2xl overflow-hidden border-2 border-[#3B82F6]/50 shadow-[0_0_60px_rgba(59,130,246,0.4)]" style={{ aspectRatio: "16/9" }}>
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900 z-20">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
            </div>
          )}
          <video
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-contain bg-black z-0"
            onLoadedData={() => setLoaded(true)}
            aria-label="NUPS system walkthrough recording"
          >
            <source
              src="https://media.base44.com/videos/public/697a087fb354faebb72df54b/5c14eac89_Screen_Recording_20260724_142817_Chrome.mp4"
              type="video/mp4"
            />
          </video>
        </div>
      </div>
    </div>
  );
}