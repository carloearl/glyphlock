import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  FileCheck2,
  Fingerprint,
  ReceiptText,
  ScanLine,
} from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: ScanLine,
    title: "Identify the guest",
    text: "Scan an ID, upload a clear ID image, or choose a recent verified guest profile for the current venue.",
  },
  {
    number: "02",
    icon: Fingerprint,
    title: "Review and confirm identity",
    text: "NUPS autofills the legal name, member reference, age status, and ID reference. The operator confirms the identity before continuing.",
  },
  {
    number: "03",
    icon: FileCheck2,
    title: "Review terms and consent",
    text: "The guest reviews the applicable GlyphBucks and VIP terms, completes the required initials, and records clickwrap assent once.",
  },
  {
    number: "04",
    icon: CreditCard,
    title: "Build the transaction",
    text: "Select the suite and services, calculate gratuity, capture the payment method, and confirm that tender matches the total.",
  },
  {
    number: "05",
    icon: BadgeCheck,
    title: "Sign and approve",
    text: "The verified guest name becomes the purchaser name everywhere. The issuer representative and manager complete their approvals.",
  },
  {
    number: "06",
    icon: ReceiptText,
    title: "Seal, print, and verify",
    text: "NUPS generates the contract and receipt from the same identity-bound record, then provides print and verification references.",
  },
];

export default function DemoRecordingSection() {
  const navigate = useNavigate();

  return (
    <section id="nups-walkthrough" className="nups-process-section" aria-labelledby="nups-process-title">
      <style>{`
        .nups-process-section {
          position: relative;
          width: 100%;
          padding: clamp(40px, 6vw, 88px) clamp(14px, 4vw, 72px);
          overflow: hidden;
          box-sizing: border-box;
          background:
            radial-gradient(circle at 15% 0%, rgba(37, 99, 235, 0.22), transparent 42%),
            radial-gradient(circle at 85% 20%, rgba(124, 58, 237, 0.18), transparent 40%),
            #020617;
        }

        .nups-process-inner {
          width: min(100%, 1440px);
          margin: 0 auto;
        }

        .nups-process-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(14px, 2vw, 24px);
          margin-top: clamp(26px, 4vw, 44px);
        }

        .nups-process-card {
          position: relative;
          min-height: 220px;
          padding: clamp(20px, 2.2vw, 30px);
          overflow: hidden;
          border: 1px solid rgba(147, 197, 253, 0.18);
          border-radius: 22px;
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 89, 0.62));
          box-shadow: 0 24px 70px rgba(2, 6, 23, 0.34);
        }

        .nups-process-card::after {
          content: "";
          position: absolute;
          inset: auto -20% -45% 30%;
          height: 150px;
          border-radius: 999px;
          background: rgba(59, 130, 246, 0.12);
          filter: blur(35px);
          pointer-events: none;
        }

        .nups-process-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border: 1px solid rgba(96, 165, 250, 0.38);
          border-radius: 15px;
          color: #bfdbfe;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.28), rgba(124, 58, 237, 0.18));
          box-shadow: 0 0 28px rgba(59, 130, 246, 0.2);
        }

        .nups-process-number {
          position: absolute;
          top: 18px;
          right: 22px;
          font-family: "JetBrains Mono", monospace;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          color: rgba(191, 219, 254, 0.48);
        }

        .nups-process-cta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-top: clamp(28px, 4vw, 48px);
          padding: clamp(20px, 3vw, 34px);
          border: 1px solid rgba(96, 165, 250, 0.28);
          border-radius: 24px;
          background: linear-gradient(120deg, rgba(30, 64, 175, 0.2), rgba(79, 70, 229, 0.18), rgba(15, 23, 42, 0.76));
        }

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

        @media (max-width: 1000px) {
          .nups-process-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .nups-landing-shell .capabilities {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 680px) {
          .nups-process-section {
            padding: 36px 14px;
          }

          .nups-process-grid {
            grid-template-columns: 1fr;
          }

          .nups-process-card {
            min-height: 0;
          }

          .nups-process-cta {
            align-items: stretch;
          }

          .nups-process-cta button {
            width: 100%;
            justify-content: center;
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

      <div className="nups-process-inner">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-xs sm:text-sm font-black tracking-[0.3em] uppercase text-blue-300">
            Identity-Bound Contract Workflow
          </p>
          <h2 id="nups-process-title" className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-white">
            One verified identity from check-in to receipt
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm sm:text-base md:text-lg leading-relaxed text-slate-300">
            The outdated walkthrough has been removed while the updated version is being recorded. This is the current NUPS contract process now implemented in the app.
          </p>
        </motion.div>

        <div className="nups-process-grid">
          {STEPS.map(({ number, icon: Icon, title, text }, index) => (
            <motion.article
              key={number}
              className="nups-process-card"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <span className="nups-process-number">{number}</span>
              <span className="nups-process-icon"><Icon className="h-6 w-6" /></span>
              <h3 className="relative z-10 mt-5 text-xl font-black text-white">{title}</h3>
              <p className="relative z-10 mt-3 text-sm leading-6 text-slate-300">{text}</p>
            </motion.article>
          ))}
        </div>

        <motion.div
          className="nups-process-cta"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-300">Current build access</p>
            <h3 className="mt-2 text-2xl sm:text-3xl font-black text-white">Enter through the NUPS access gateway</h3>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Staff, entertainers, managers, and owners continue through the same entry point and are routed by their verified role.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/NUPSKiosk")}
            className="inline-flex min-h-[54px] items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-4 text-sm font-black uppercase tracking-wider text-white shadow-[0_0_35px_rgba(59,130,246,0.36)] transition-transform hover:scale-[1.02]"
          >
            Enter NUPS <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
