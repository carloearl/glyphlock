import React, { useState } from "react";
import { motion } from "framer-motion";

const RECORDING_URL =
  "https://media.base44.com/videos/public/697a087fb354faebb72df54b/5c14eac89_Screen_Recording_20260724_142817_Chrome.mp4";

export default function DemoRecordingSection() {
  const [loaded, setLoaded] = useState(false);

  return (
    <section className="nups-recording-section" aria-labelledby="nups-recording-title">
      <style>{`
        .nups-recording-section {
          position: relative;
          width: 100vw;
          margin-left: calc(50% - 50vw);
          padding: clamp(28px, 4vw, 64px) 0 0;
          overflow: hidden;
          background: #020617;
        }

        .nups-recording-copy {
          width: min(100%, 1100px);
          margin: 0 auto;
          padding: 0 clamp(18px, 4vw, 64px) clamp(20px, 3vw, 36px);
          text-align: center;
        }

        .nups-recording-frame {
          --nups-recording-zoom: 1.18;
          position: relative;
          width: 100vw;
          aspect-ratio: 9 / 18.7;
          overflow: hidden;
          background: #000;
          border-top: 1px solid rgba(59, 130, 246, 0.55);
          border-bottom: 1px solid rgba(59, 130, 246, 0.55);
          box-shadow: 0 0 70px rgba(59, 130, 246, 0.28);
        }

        .nups-recording-video {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center bottom;
          transform: scale(var(--nups-recording-zoom));
          transform-origin: center bottom;
          background: #000;
        }

        .nups-recording-loading {
          position: absolute;
          inset: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #071a3d, #17134b, #071a3d);
        }

        /* Landing-page scaling rules. These are scoped to NUPS only. */
        .nups-landing-shell {
          width: 100%;
          max-width: 100%;
          overflow-x: clip;
        }

        .nups-landing-shell .container {
          width: 100%;
          max-width: none;
          padding-left: clamp(18px, 4vw, 72px);
          padding-right: clamp(18px, 4vw, 72px);
        }

        .nups-landing-shell img,
        .nups-landing-shell video,
        .nups-landing-shell svg {
          max-width: 100%;
        }

        .nups-landing-shell .diagram-frame,
        .nups-landing-shell .diagram-wrap,
        .nups-landing-shell .protection-section,
        .nups-landing-shell .shield-section,
        .nups-landing-shell .footer-cta {
          width: 100%;
          max-width: 100%;
        }

        @media (max-width: 1100px) {
          .nups-recording-frame {
            --nups-recording-zoom: 1.16;
          }

          .nups-landing-shell .container {
            padding-left: clamp(16px, 3vw, 40px);
            padding-right: clamp(16px, 3vw, 40px);
          }

          .nups-landing-shell .capabilities {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .nups-recording-section {
            padding-top: 24px;
          }

          .nups-recording-frame {
            --nups-recording-zoom: 1.14;
            aspect-ratio: 9 / 18.7;
          }

          .nups-recording-copy {
            padding-left: 18px;
            padding-right: 18px;
          }

          .nups-landing-shell .container {
            padding-left: 14px;
            padding-right: 14px;
          }

          .nups-landing-shell .capabilities,
          .nups-landing-shell .stakeholders,
          .nups-landing-shell .tier-grid,
          .nups-landing-shell .flow-track {
            grid-template-columns: 1fr;
          }

          .nups-landing-shell .brand-bar,
          .nups-landing-shell .section-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="nups-recording-copy">
        <p className="text-xs sm:text-sm font-black tracking-[0.3em] uppercase text-blue-300">
          Recorded Walkthrough
        </p>
        <h2
          id="nups-recording-title"
          className="text-2xl sm:text-3xl md:text-4xl font-black text-white mt-2"
        >
          See the Full NUPS Contract Process
        </h2>
        <p className="mx-auto mt-2 max-w-3xl text-sm sm:text-base text-slate-400">
          The real contract workflow is presented at full width. The embedded phone browser chrome is cropped while the recording remains tall and readable on desktop, tablet, and mobile.
        </p>
      </div>

      <motion.div
        className="nups-recording-frame"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: 0.45 }}
      >
        {!loaded && (
          <div className="nups-recording-loading">
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
          <source src={RECORDING_URL} type="video/mp4" />
        </video>
      </motion.div>
    </section>
  );
}
