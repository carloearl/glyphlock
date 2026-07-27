import React, { useState } from "react";
import { motion } from "framer-motion";

export default function DemoRecordingSection() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div id="nups-walkthrough" className="w-full py-5 scroll-mt-24">
      <style>{`
        .nups-recording-frame {
          position: relative;
          width: min(100%, 920px);
          height: min(94svh, 1120px);
          min-height: 720px;
          margin: 0 auto;
          overflow: hidden;
          background: #000;
          border: 1px solid rgba(59, 130, 246, 0.55);
          border-radius: 18px;
          box-shadow: 0 0 60px rgba(59, 130, 246, 0.38);
        }

        .nups-recording-video {
          position: absolute;
          left: 0;
          top: -42px;
          width: 100%;
          height: calc(100% + 42px);
          object-fit: contain;
          object-position: center top;
          background: #000;
        }

        @media (max-width: 700px) {
          .nups-recording-frame {
            width: 100%;
            height: min(92svh, 1040px);
            min-height: 640px;
            border-left: 0;
            border-right: 0;
            border-radius: 0;
          }

          .nups-recording-video {
            top: -34px;
            height: calc(100% + 34px);
          }
        }
      `}</style>

      <div className="text-center mb-4 px-4">
        <p className="text-xs sm:text-sm font-black tracking-[0.3em] uppercase text-blue-300">
          Recorded Walkthrough
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mt-2">
          See the Full NUPS Contract Process
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base text-slate-400">
          The recording is shown at its full vertical ratio so the complete contract workflow remains visible.
        </p>
      </div>

      <motion.div
        className="nups-recording-frame"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.45 }}
      >
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900 z-20">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
          </div>
        )}

        <video
          controls
          playsInline
          preload="metadata"
          className="nups-recording-video z-0"
          onLoadedData={() => setLoaded(true)}
          aria-label="Full NUPS contract process walkthrough recording"
        >
          <source
            src="https://media.base44.com/videos/public/697a087fb354faebb72df54b/5c14eac89_Screen_Recording_20260724_142817_Chrome.mp4"
            type="video/mp4"
          />
        </video>
      </motion.div>
    </div>
  );
}
