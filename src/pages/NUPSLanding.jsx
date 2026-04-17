import React from "react";
import { useNavigate } from "react-router-dom";

export default function NUPSLanding() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');

        :root {
          --void: #030614;
          --abyss: #07091c;
          --deep: #0a1230;
          --navy: #0f1a3d;
          --panel: #121b42;
          --line: #1e2a5c;
          --cyan: #00d4ff;
          --cyan-soft: #6ee7f9;
          --sapphire: #1e6fff;
          --indigo: #6366f1;
          --violet: #8b5cf6;
          --teal: #14b8a6;
          --danger: #ef4444;
          --pass: #10b981;
          --ink: #e0e7ff;
          --ink-bright: #ffffff;
          --ink-dim: #7c8db8;
          --shadow-panel: 0 20px 60px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 212, 255, 0.08);
        }

        .nups-landing-shell * { box-sizing: border-box; }
        .nups-landing-shell {
          background: var(--void);
          color: var(--ink);
          font-family: 'Rajdhani', sans-serif;
          font-size: 16px;
          line-height: 1.55;
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
          background-image:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30, 111, 255, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 0% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 100% 100%, rgba(0, 212, 255, 0.08) 0%, transparent 60%);
        }

        .nups-landing-shell::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 212, 255, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.035) 1px, transparent 1px);
          background-size: 72px 72px;
          pointer-events: none;
          z-index: 0;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 85%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 85%);
          animation: grid-drift 120s linear infinite;
        }

        .nups-landing-shell::after {
          content: '';
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0, 212, 255, 0.015) 3px, rgba(0, 212, 255, 0.015) 4px);
          pointer-events: none;
          z-index: 1;
          mix-blend-mode: overlay;
        }

        @keyframes grid-drift {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 72px 72px, 72px 72px; }
        }

        .ambient {
          position: fixed;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
        }
        .ambient.one {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.3), transparent 70%);
          top: 10%; left: -10%;
          animation: float-a 18s ease-in-out infinite;
        }
        .ambient.two {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.25), transparent 70%);
          top: 50%; right: -15%;
          animation: float-b 24s ease-in-out infinite;
        }
        .ambient.three {
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(30, 111, 255, 0.2), transparent 70%);
          bottom: 10%; left: 40%;
          animation: float-c 20s ease-in-out infinite;
        }

        @keyframes float-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(100px, 80px) scale(1.1); }
        }
        @keyframes float-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-80px, -60px) scale(1.15); }
        }
        @keyframes float-c {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, -100px) scale(0.9); }
        }

        .container {
          max-width: 1480px;
          margin: 0 auto;
          padding: 56px 32px 96px;
          position: relative;
          z-index: 2;
        }

        .brand-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 28px;
          border-bottom: 1px solid var(--line);
          margin-bottom: 56px;
          position: relative;
        }
        .brand-bar::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 0;
          width: 120px; height: 1px;
          background: linear-gradient(90deg, var(--cyan), transparent);
          box-shadow: 0 0 8px var(--cyan);
          animation: scan-line 3s ease-in-out infinite;
        }
        @keyframes scan-line {
          0%, 100% { width: 120px; opacity: 1; }
          50% { width: 240px; opacity: 0.6; }
        }
        .brand-mark { display: flex; align-items: center; gap: 16px; }
        .logo-wrap {
          width: 48px; height: 48px;
          position: relative;
          animation: logo-pulse 4s ease-in-out infinite;
        }
        @keyframes logo-pulse {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(0,212,255,0.6)); }
          50% { filter: drop-shadow(0 0 20px rgba(0,212,255,0.9)) drop-shadow(0 0 40px rgba(139,92,246,0.5)); }
        }
        .wordmark {
          font-family: 'Orbitron', sans-serif;
          font-weight: 800;
          font-size: 24px;
          letter-spacing: 0.08em;
          background: linear-gradient(180deg, var(--ink-bright) 0%, var(--cyan) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .brand-meta {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--ink-dim);
          text-align: right;
          line-height: 2;
        }
        .brand-meta .pat { color: var(--cyan); }
        .brand-meta .stamp {
          display: inline-block;
          padding: 3px 10px;
          border: 1px solid var(--cyan);
          color: var(--cyan);
          margin-top: 6px;
          background: rgba(0, 212, 255, 0.08);
        }

        .hero {
          text-align: center;
          padding: 40px 0 80px;
        }
        .hero .eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.5em;
          text-transform: uppercase;
          color: var(--cyan);
          margin-bottom: 24px;
          display: inline-flex;
          align-items: center;
          gap: 14px;
        }
        .hero .eyebrow::before,
        .hero .eyebrow::after {
          content: '';
          display: inline-block;
          width: 48px; height: 1px;
          background: linear-gradient(90deg, transparent, var(--cyan), transparent);
        }
        .hero h1 {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: clamp(42px, 7vw, 92px);
          letter-spacing: -0.01em;
          line-height: 0.95;
          margin-bottom: 32px;
        }
        .hero h1 .line-1 {
          display: block;
          color: var(--ink-bright);
          text-shadow: 0 0 40px rgba(59, 130, 246, 0.4), 0 0 80px rgba(0, 212, 255, 0.2);
        }
        .hero h1 .line-2 {
          display: block;
          background: linear-gradient(135deg, var(--cyan) 0%, var(--sapphire) 50%, var(--violet) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
          animation: gradient-shift 6s ease-in-out infinite;
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .lede {
          font-size: 22px;
          font-weight: 400;
          line-height: 1.4;
          color: var(--ink-dim);
          max-width: 780px;
          margin: 0 auto;
        }
        .lede b { color: var(--cyan-soft); font-weight: 600; }

        .enter-wrap {
          margin-top: 38px;
          display: flex;
          justify-content: center;
        }
        .enter-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 18px 30px;
          background: linear-gradient(135deg, var(--sapphire), var(--violet));
          color: var(--ink-bright);
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          clip-path: polygon(16px 0, 100% 0, calc(100% - 16px) 100%, 0 100%);
          transition: all 0.3s;
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        .enter-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 50px rgba(139, 92, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        .pulse-dot {
          width: 10px; height: 10px;
          background: var(--cyan);
          border-radius: 50%;
          box-shadow: 0 0 12px var(--cyan);
          animation: dot-pulse 1.5s ease-in-out infinite;
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .ticker {
          display: flex;
          justify-content: center;
          gap: 48px;
          margin-top: 48px;
          padding: 20px 32px;
          border: 1px solid var(--line);
          background: rgba(7, 9, 28, 0.6);
          backdrop-filter: blur(12px);
          flex-wrap: wrap;
        }
        .stat { text-align: center; position: relative; }
        .stat::after {
          content: '';
          position: absolute;
          right: -24px; top: 10%;
          width: 1px; height: 80%;
          background: linear-gradient(180deg, transparent, var(--line), transparent);
        }
        .stat:last-child::after { display: none; }
        .num {
          font-family: 'Orbitron', sans-serif;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(180deg, var(--cyan), var(--sapphire));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          display: block;
        }
        .label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.25em;
          color: var(--ink-dim);
          text-transform: uppercase;
          margin-top: 4px;
        }

        .section-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--line);
          position: relative;
        }
        .section-header::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 0;
          width: 80px; height: 2px;
          background: var(--cyan);
          box-shadow: 0 0 12px var(--cyan);
        }
        .section-header h2 {
          font-family: 'Orbitron', sans-serif;
          font-weight: 500;
          font-size: 32px;
          letter-spacing: 0.02em;
          color: var(--ink-bright);
          text-transform: uppercase;
        }
        .section-header h2 b {
          font-weight: 800;
          background: linear-gradient(135deg, var(--cyan), var(--violet));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .index {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.3em;
          color: var(--ink-dim);
          text-transform: uppercase;
        }

        .diagram-frame,
        .protection-section,
        .shield-section,
        .tech-tab,
        .econ-card,
        .sandbox-card,
        .cap,
        .tier,
        .payout-viz {
          box-shadow: var(--shadow-panel);
        }

        .diagram-frame,
        .protection-section,
        .econ-card,
        .sandbox-card,
        .payout-viz,
        .footer-cta {
          background: linear-gradient(180deg, var(--abyss) 0%, var(--deep) 100%);
          border: 1px solid var(--line);
        }

        .diagram-frame { padding: 32px 24px; margin-bottom: 96px; overflow: hidden; }
        .diagram-wrap { width: 100%; aspect-ratio: 1600 / 1200; min-height: 380px; position: relative; }
        svg.diagram { width: 100%; height: 100%; display: block; }
        .nups-logo-core {
          filter: drop-shadow(0 0 22px rgba(0, 212, 255, 0.9)) drop-shadow(0 0 54px rgba(99, 102, 241, 0.5));
          opacity: 0.98;
        }
        .arch-top-gl {
          filter: drop-shadow(0 0 14px rgba(0, 212, 255, 0.75)) drop-shadow(0 0 32px rgba(30, 111, 255, 0.45));
        }
        .legend {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 24px;
          padding-top: 28px;
          margin-top: 28px;
          border-top: 1px solid var(--line);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-dim);
        }
        .legend span { display: inline-flex; align-items: center; gap: 10px; }
        .legend i { display: inline-block; width: 28px; height: 2px; }
        .legend i.ctrl { background: var(--indigo); }
        .legend i.data { background: var(--cyan); }
        .legend i.tx { background: var(--sapphire); }
        .legend i.audit { background-image: repeating-linear-gradient(90deg, var(--violet) 0 6px, transparent 6px 10px); }
        .legend i.chain { background-image: repeating-linear-gradient(90deg, var(--teal) 0 4px, transparent 4px 8px); }
        .legend i.isolate { background-image: repeating-linear-gradient(90deg, var(--danger) 0 4px, transparent 4px 8px); }

        .protection-section { margin-bottom: 96px; padding: 40px 32px; }
        .protection-intro { max-width: 760px; margin-bottom: 48px; }
        .protection-intro .eyebrow,
        .shield-copy .eyebrow,
        .card-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 16px;
        }
        .protection-intro .eyebrow { color: var(--violet); }
        .protection-intro h3,
        .shield-copy h3 {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 40px;
          line-height: 1.1;
          color: var(--ink-bright);
          margin-bottom: 20px;
        }
        .glow {
          background: linear-gradient(135deg, var(--cyan), var(--violet));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .protection-intro p,
        .shield-copy p,
        .payout-copy p,
        .split-section p,
        .footer-cta p {
          font-size: 17px;
          color: var(--ink-dim);
          line-height: 1.5;
        }
        .protection-intro p b,
        .shield-copy p b,
        .payout-copy p b,
        .lede b { color: var(--cyan-soft); }

        .stakeholders {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .stakeholder {
          background: var(--void);
          border: 1px solid var(--line);
          padding: 28px 24px;
          position: relative;
        }
        .stakeholder::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--sh-color, var(--cyan));
          box-shadow: 0 0 12px var(--sh-color, var(--cyan));
        }
        .stakeholder .label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.3em;
          color: var(--sh-color, var(--cyan));
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .stakeholder h4 {
          font-family: 'Orbitron', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--ink-bright);
          margin-bottom: 14px;
          text-transform: uppercase;
        }
        .risk, .benefit { font-size: 14px; }
        .risk { color: var(--danger); margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed var(--line); }
        .benefit { color: var(--ink); }
        .risk em, .benefit em, .note em, .item em {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-style: normal;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 4px;
        }
        .risk em { color: var(--ink-dim); }
        .benefit em { color: var(--sh-color, var(--cyan)); }

        .tier-section { margin-bottom: 96px; }
        .tier-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0;
          border: 1px solid var(--line);
          background: var(--line);
          margin-top: 40px;
          overflow: hidden;
        }
        .tier {
          background: linear-gradient(180deg, var(--abyss), var(--deep));
          padding: 28px 20px;
          position: relative;
          border-right: 1px solid var(--line);
        }
        .tier:last-child { border-right: none; }
        .tier::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--tier-color, var(--cyan));
          box-shadow: 0 0 16px var(--tier-color, var(--cyan));
        }
        .rank {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: var(--ink-dim);
          letter-spacing: 0.2em;
          margin-bottom: 8px;
        }
        .rank em { color: var(--tier-color, var(--cyan)); font-style: normal; font-weight: 600; }
        .tier h4 {
          font-family: 'Orbitron', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: var(--ink-bright);
          letter-spacing: 0.04em;
          margin-bottom: 14px;
          text-transform: uppercase;
        }
        .tier ul { list-style: none; }
        .tier ul li {
          font-size: 13px;
          color: var(--ink-dim);
          padding: 4px 0;
          border-bottom: 1px dashed rgba(30, 42, 92, 0.5);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .tier ul li::before {
          content: '◆';
          color: var(--tier-color, var(--cyan));
          font-size: 8px;
          opacity: 0.7;
        }
        .tier ul li:last-child { border-bottom: none; }

        .shield-section,
        .split-section,
        .payout-wrap,
        .tech-tabs,
        .capabilities,
        .flow-track {
          display: grid;
          gap: 0;
        }
        .shield-section {
          grid-template-columns: 1fr 1fr;
          gap: 56px;
          margin-bottom: 96px;
          align-items: stretch;
          padding: 40px 32px;
        }
        .shield-package {
          background: var(--abyss);
          border: 1px solid var(--violet);
          padding: 32px;
          box-shadow: 0 0 60px rgba(139, 92, 246, 0.15);
        }
        .pkg-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--line);
          margin-bottom: 20px;
        }
        .pkg-header .name {
          font-family: 'Orbitron', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--violet);
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }
        .pkg-header .id { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--ink-dim); }
        .contents { list-style: none; }
        .contents li {
          display: grid;
          grid-template-columns: 32px 1fr auto;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px dashed rgba(30, 42, 92, 0.5);
          gap: 12px;
        }
        .contents li:last-child { border-bottom: none; }
        .ic {
          width: 28px; height: 28px;
          border: 1px solid var(--violet);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--violet);
        }
        .ic svg { width: 16px; height: 16px; }
        .txt { font-size: 15px; color: var(--ink); font-weight: 500; }
        .status {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: var(--pass);
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .payout-section { margin-bottom: 96px; }
        .payout-wrap { grid-template-columns: 340px 1fr; gap: 48px; align-items: start; }
        .payout-copy h3,
        .split-section h3 {
          font-family: 'Orbitron', sans-serif;
          font-weight: 600;
          font-size: 28px;
          color: var(--ink-bright);
          margin-bottom: 20px;
        }
        .payout-copy h3 b,
        .split-section h3 b {
          background: linear-gradient(135deg, var(--cyan), var(--violet));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
        }
        .note {
          margin-top: 20px;
          padding: 14px 18px;
          background: rgba(139, 92, 246, 0.08);
          border-left: 3px solid var(--violet);
          font-size: 13px;
          color: var(--ink);
        }
        .note em { color: var(--violet); }
        .payout-viz { padding: 36px; position: relative; overflow: hidden; }
        .payout-viz::before,
        .econ-card::before,
        .sandbox-card::before,
        .footer-cta::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--cyan), var(--violet));
        }
        .title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: var(--cyan);
          letter-spacing: 0.3em;
          text-transform: uppercase;
          margin-bottom: 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .badge {
          padding: 3px 10px;
          border: 1px solid var(--violet);
          color: var(--violet);
          background: rgba(139,92,246,0.08);
          font-size: 9px;
        }
        .payout-flow {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          gap: 20px;
          align-items: center;
          margin-bottom: 28px;
        }
        .payout-node {
          background: var(--void);
          border: 1px solid var(--line);
          padding: 20px 16px;
          text-align: center;
          position: relative;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .payout-node::before {
          content: '';
          position: absolute;
          top: -1px; left: -1px; right: -1px;
          height: 2px;
          background: var(--node-color, var(--cyan));
        }
        .n-label, .n-var, .op {
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        .n-label { font-size: 9px; color: var(--node-color, var(--cyan)); margin-bottom: 8px; }
        .n-val {
          font-family: 'Orbitron', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--ink-bright);
        }
        .n-sub { font-size: 12px; color: var(--ink-dim); margin-top: 6px; }
        .n-var {
          position: absolute;
          top: 6px; right: 8px;
          font-size: 8px;
          color: var(--node-color, var(--cyan));
          opacity: 0.6;
        }
        .payout-arrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 20px;
          color: var(--cyan);
          text-align: center;
        }
        .op {
          font-size: 11px;
          color: var(--ink-dim);
          display: block;
          margin-top: 4px;
        }
        .payout-legend {
          padding-top: 20px;
          border-top: 1px dashed var(--line);
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .item { font-size: 13px; color: var(--ink-dim); }
        .item em { color: var(--cyan); }
        .item b { color: var(--ink); font-weight: 600; }

        .flow-section { margin-bottom: 96px; }
        .flow-track {
          grid-template-columns: repeat(6, 1fr);
          border: 1px solid var(--line);
          background: var(--line);
          margin-top: 40px;
        }
        .flow-step {
          padding: 28px 22px;
          min-height: 260px;
          background: linear-gradient(180deg, var(--abyss), var(--deep));
          border-right: 1px solid var(--line);
          position: relative;
        }
        .flow-step:last-child { border-right: none; }
        .flow-step::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 40px; height: 1px;
          background: var(--cyan);
          box-shadow: 0 0 8px var(--cyan);
        }
        .flow-step .num {
          font-size: 28px;
          margin-bottom: 16px;
          line-height: 1;
          background: linear-gradient(135deg, var(--cyan), var(--indigo));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .flow-step h4 {
          font-family: 'Orbitron', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: var(--ink-bright);
          margin-bottom: 12px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .flow-step p { font-size: 14px; color: var(--ink-dim); line-height: 1.5; }
        .trigger {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: var(--cyan);
          margin-top: 14px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          display: block;
          padding-top: 10px;
          border-top: 1px dashed var(--line);
        }

        .tech-stack { margin-bottom: 96px; }
        .tech-tabs {
          grid-template-columns: repeat(3, 1fr);
          border: 1px solid var(--line);
          background: var(--line);
          margin-top: 40px;
        }
        .tech-tab {
          background: linear-gradient(180deg, var(--abyss), var(--deep));
          padding: 36px 32px;
          border-right: 1px solid var(--line);
          position: relative;
        }
        .tech-tab:last-child { border-right: none; }
        .tech-tab::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--tab-color, var(--cyan));
          box-shadow: 0 0 16px var(--tab-color, var(--cyan));
        }
        .tab-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px; }
        .icon-wrap {
          width: 40px; height: 40px;
          border: 1px solid var(--tab-color, var(--cyan));
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--tab-color, var(--cyan));
          flex-shrink: 0;
        }
        .icon-wrap svg { width: 20px; height: 20px; }
        .tech-tab .num { font-size: 10px; color: var(--ink-dim); letter-spacing: 0.3em; }
        .tech-tab h4 {
          font-family: 'Orbitron', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--ink-bright);
          letter-spacing: 0.02em;
          margin-bottom: 20px;
          text-transform: uppercase;
        }
        .tech-tab h4 em {
          font-style: normal;
          color: var(--tab-color, var(--cyan));
          font-weight: 500;
          font-size: 14px;
          display: block;
          margin-top: 4px;
          letter-spacing: 0.1em;
        }
        .tech-tab ul { list-style: none; }
        .tech-tab ul li {
          padding: 14px 0;
          border-bottom: 1px dashed rgba(30, 42, 92, 0.6);
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: start;
        }
        .tech-tab ul li:last-child { border-bottom: none; }
        .k {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: var(--tab-color, var(--cyan));
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 3px 8px;
          border: 1px solid var(--tab-color, var(--cyan));
          background: rgba(0,0,0,0.3);
          white-space: nowrap;
        }
        .v { font-size: 14px; color: var(--ink); line-height: 1.4; }
        .v b { color: var(--ink-bright); font-weight: 600; }
        .v em {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-style: normal;
          color: var(--ink-dim);
          display: block;
          margin-top: 2px;
        }
        code { font-family: 'JetBrains Mono', monospace; }

        .split-section {
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          margin-bottom: 96px;
        }
        .econ-card, .sandbox-card { padding: 40px; position: relative; overflow: hidden; }
        .card-label { color: var(--cyan); }
        .econ-table {
          margin-top: 24px;
          border: 1px solid var(--line);
          background: var(--void);
        }
        .row {
          display: grid;
          grid-template-columns: 1fr auto;
          padding: 14px 18px;
          border-bottom: 1px solid var(--line);
          align-items: center;
        }
        .row:last-child { border-bottom: none; }
        .row.header {
          background: var(--panel);
          padding: 10px 18px;
        }
        .row.header .k, .row.header .v {
          font-size: 9px;
          letter-spacing: 0.25em;
          color: var(--cyan);
          font-weight: 500;
        }
        .row .k {
          border: none;
          padding: 0;
          background: none;
          white-space: normal;
          font-family: 'Rajdhani', sans-serif;
          font-size: 15px;
          color: var(--ink);
          letter-spacing: 0;
          text-transform: none;
        }
        .row .k em {
          color: var(--ink-dim);
          font-style: normal;
          font-size: 12px;
          font-family: 'JetBrains Mono', monospace;
          margin-left: 8px;
        }
        .row .v {
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          color: var(--cyan);
          font-weight: 500;
        }
        .row.total {
          background: linear-gradient(90deg, rgba(0,212,255,0.08), transparent);
          border-top: 1px solid var(--cyan);
        }
        .row.total .v { color: var(--cyan-soft); font-size: 17px; }
        .sandbox-modes { margin-top: 28px; display: grid; gap: 12px; }
        .sandbox-mode {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 16px;
          padding: 16px 20px;
          background: var(--void);
          border: 1px solid var(--line);
          align-items: center;
        }
        .sandbox-mode .dot {
          width: 12px; height: 12px;
          border-radius: 50%;
          background: var(--mode-color, var(--cyan));
          box-shadow: 0 0 12px var(--mode-color, var(--cyan));
        }
        .sandbox-mode .name {
          font-family: 'Orbitron', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .sandbox-mode .name em {
          display: block;
          font-style: normal;
          font-family: 'Rajdhani', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: var(--ink-dim);
          margin-top: 2px;
          letter-spacing: normal;
          text-transform: none;
        }
        .key {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: var(--mode-color, var(--cyan));
          letter-spacing: 0.1em;
        }

        .capabilities {
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--line);
          margin-bottom: 96px;
          border: 1px solid var(--line);
        }
        .cap {
          background: linear-gradient(180deg, var(--abyss), var(--deep));
          padding: 36px 28px;
          position: relative;
        }
        .cap::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 40px; height: 2px;
          background: var(--cyan);
          box-shadow: 0 0 8px var(--cyan);
        }
        .cap .icon {
          width: 36px; height: 36px;
          margin-bottom: 22px;
          color: var(--cyan);
          filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.4));
        }
        .cap h4 {
          font-family: 'Orbitron', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--ink-bright);
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        .cap p { font-size: 14px; color: var(--ink-dim); line-height: 1.5; }
        .tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.2em;
          color: var(--violet);
          text-transform: uppercase;
          display: block;
          margin-bottom: 10px;
        }

        .footer-cta {
          text-align: center;
          padding: 80px 32px;
          position: relative;
          overflow: hidden;
        }
        .footer-cta h3 {
          font-family: 'Orbitron', sans-serif;
          font-weight: 600;
          font-size: 52px;
          line-height: 1.05;
          margin-bottom: 28px;
          color: var(--ink-bright);
          letter-spacing: -0.02em;
        }
        .footer-cta .stamp {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.3em;
          color: var(--cyan);
          text-transform: uppercase;
          margin-top: 48px;
          padding-top: 28px;
          border-top: 1px solid var(--line);
        }

        .svg-title { font-family: 'Orbitron', sans-serif; font-weight: 700; fill: var(--ink-bright); letter-spacing: 0.02em; }
        .svg-serif { font-family: 'Rajdhani', sans-serif; font-weight: 500; fill: var(--ink); }
        .svg-mono { font-family: 'JetBrains Mono', monospace; fill: var(--ink-dim); letter-spacing: 0.08em; }
        .svg-tag { font-family: 'JetBrains Mono', monospace; font-weight: 500; fill: var(--cyan); letter-spacing: 0.2em; text-transform: uppercase; }
        .flow-animate { stroke-dasharray: 4 8; animation: flow 2.4s linear infinite; }
        @keyframes flow { to { stroke-dashoffset: -36; } }
        .pulse-node { animation: pulse-node 2.4s ease-in-out infinite; }
        @keyframes pulse-node {
          0%, 100% { opacity: 0.5; r: 3; }
          50% { opacity: 1; r: 6; }
        }
        .orbit-glow { animation: orbit-glow 4s ease-in-out infinite; }
        @keyframes orbit-glow {
          0%, 100% { filter: drop-shadow(0 0 6px currentColor); }
          50% { filter: drop-shadow(0 0 16px currentColor); }
        }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        @keyframes spin-reverse { to { transform: rotate(-360deg); } }

        @media (max-width: 1200px) {
          .tier-grid { grid-template-columns: repeat(4, 1fr); }
          .flow-track { grid-template-columns: repeat(3, 1fr); }
          .capabilities { grid-template-columns: repeat(2, 1fr); }
          .shield-section, .split-section, .payout-wrap { grid-template-columns: 1fr; gap: 32px; }
          .stakeholders { grid-template-columns: repeat(2, 1fr); }
          .tech-tabs { grid-template-columns: 1fr; }
          .tech-tab { border-right: none; border-bottom: 1px solid var(--line); }
          .payout-flow { grid-template-columns: 1fr; gap: 12px; }
          .payout-arrow { transform: rotate(90deg); }
        }
        @media (max-width: 700px) {
          .container { padding: 24px 16px; }
          .brand-bar { flex-direction: column; gap: 20px; align-items: flex-start; }
          .brand-meta { text-align: left; }
          .hero { padding: 20px 0 48px; }
          .ticker { gap: 20px; padding: 16px 20px; }
          .stat::after { display: none; }
          .num { font-size: 22px; }
          .diagram-frame { padding: 24px 16px; }
          .tier-grid { grid-template-columns: 1fr 1fr; }
          .flow-track { grid-template-columns: 1fr; }
          .flow-step { border-right: none; border-bottom: 1px solid var(--line); }
          .capabilities { grid-template-columns: 1fr; }
          .stakeholders { grid-template-columns: 1fr; }
          .footer-cta h3 { font-size: 32px; }
          .shield-section, .protection-section { padding: 28px 20px; }
          .shield-copy h3, .protection-intro h3 { font-size: 28px; }
          .section-header { flex-direction: column; align-items: flex-start; gap: 8px; }
          .payout-legend { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="nups-landing-shell">
        <div className="ambient one" />
        <div className="ambient two" />
        <div className="ambient three" />

        <div
          style={{
            position: 'fixed',
            top: 18,
            left: 18,
            width: 56,
            height: 56,
            zIndex: 9999,
            pointerEvents: 'none',
            filter: 'drop-shadow(0 0 14px rgba(0,212,255,0.55)) drop-shadow(0 0 28px rgba(99,102,241,0.35))',
          }}
          aria-hidden="true"
        >
          <img
            src="https://media.base44.com/images/public/697a087fb354faebb72df54b/f82c93c8c_lglogo.png"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        </div>

        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <defs>
            <symbol id="gl-mark" viewBox="0 0 100 100">
              <polygon points="50,6 89,28 89,72 50,94 11,72 11,28" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <polygon points="50,20 76,35 76,65 50,80 24,65 24,35" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
              <circle cx="50" cy="44" r="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <path d="M 47 50 L 47 66 L 53 66 L 53 50 Z" fill="currentColor" />
              <line x1="50" y1="6" x2="50" y2="14" stroke="currentColor" strokeWidth="1.5" />
              <line x1="50" y1="86" x2="50" y2="94" stroke="currentColor" strokeWidth="1.5" />
              <line x1="11" y1="50" x2="19" y2="50" stroke="currentColor" strokeWidth="1.5" />
              <line x1="81" y1="50" x2="89" y2="50" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="50" cy="6" r="2" fill="currentColor" />
              <circle cx="50" cy="94" r="2" fill="currentColor" />
              <circle cx="11" cy="50" r="2" fill="currentColor" />
              <circle cx="89" cy="50" r="2" fill="currentColor" />
            </symbol>
          </defs>
        </svg>

        <div className="container">
          <header className="brand-bar">
            <div className="brand-mark">
              <div className="logo-wrap">
                <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", color: "var(--cyan)" }}>
                  <use href="#gl-mark" />
                </svg>
              </div>
              <div className="wordmark">GLYPHLOCK</div>
            </div>
            <div className="brand-meta">
              <div>USPTO <span className="pat">18/584,961</span></div>
              <div>AZ Entity <span className="pat">#23831258</span></div>
              <div>DACO · Master Covenant</div>
              <div className="stamp">NUPS · LIVE</div>
            </div>
          </header>

          <section className="hero">
            <div className="eyebrow">Node Universal Platform System</div>
            <h1>
              <span className="line-1">The operating system</span>
              <span className="line-2">behind the venue.</span>
            </h1>
            <p className="lede">
              NUPS replaces fragmented POS and manual door ledgers with one <b>closed-loop infrastructure</b>. Identity, payment, payout, audit, and dispute defense — unified on a single multi-tenant platform engineered for <b>high-risk venues</b>, with a printed contract that is manager-signed, hostess-signed, scanned back into the system, and hardcopy-archived for bookkeeping and litigation.
            </p>
            <div className="enter-wrap" style={{ gap: 16, flexWrap: 'wrap' }}>
              <button className="enter-btn" onClick={() => navigate('/NUPSGateway')}>
                <span className="pulse-dot" />
                Enter N.U.P.S.
              </button>
              <button
                className="enter-btn"
                onClick={() => navigate('/NUPSInfrastructurePage')}
                style={{ background: 'linear-gradient(135deg, var(--cyan), var(--sapphire))' }}
              >
                <span className="pulse-dot" />
                Infrastructure UI
              </button>
            </div>
            <div className="ticker">
              <div className="stat"><span className="num">7</span><span className="label">Access Tiers</span></div>
              <div className="stat"><span className="num">3</span><span className="label">Runtime Modes</span></div>
              <div className="stat"><span className="num">1-PUSH</span><span className="label">Dispute Shield</span></div>
              <div className="stat"><span className="num">1</span><span className="label">Hardcopy Archive</span></div>
              <div className="stat"><span className="num">∞</span><span className="label">Venue Tenants</span></div>
            </div>
          </section>

          <div className="section-header"><h2>System <b>Architecture</b></h2><div className="index">§ 01 · Topology</div></div>
          <div className="diagram-frame">
            <div className="diagram-wrap">
              <svg className="diagram" viewBox="0 0 1600 1200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <marker id="a-cyan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#00d4ff" /></marker>
                  <marker id="a-violet" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" /></marker>
                  <marker id="a-sapph" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#1e6fff" /></marker>
                  <marker id="a-indigo" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" /></marker>
                  <radialGradient id="core-glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#00d4ff" stopOpacity="0.4" /><stop offset="40%" stopColor="#1e6fff" stopOpacity="0.2" /><stop offset="100%" stopColor="#4f46e5" stopOpacity="0" /></radialGradient>
                  <linearGradient id="panel-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#121b42" /><stop offset="100%" stopColor="#07091c" /></linearGradient>
                  <linearGradient id="platform-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.08" /></linearGradient>
                  <linearGradient id="venue-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#00d4ff" stopOpacity="0.15" /><stop offset="100%" stopColor="#1e6fff" stopOpacity="0.05" /></linearGradient>
                  <pattern id="inner-grid" patternUnits="userSpaceOnUse" width="40" height="40"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e2a5c" strokeWidth="0.5" opacity="0.4" /></pattern>
                  <pattern id="isolation" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" stroke="#ef4444" strokeWidth="1" opacity="0.3" /></pattern>
                </defs>
                <rect width="1600" height="1200" fill="url(#inner-grid)" />
                <g stroke="#00d4ff" strokeWidth="1" fill="none" opacity="0.6">
                  <path d="M 20 20 L 44 20 M 20 20 L 20 44" />
                  <path d="M 1580 20 L 1556 20 M 1580 20 L 1580 44" />
                  <path d="M 20 1180 L 44 1180 M 20 1180 L 20 1156" />
                  <path d="M 1580 1180 L 1556 1180 M 1580 1180 L 1580 1156" />
                </g>
                <g>
                  <rect x="80" y="80" width="1440" height="240" fill="url(#platform-grad)" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="8 4" rx="4" />
                  <text className="svg-tag" x="110" y="110" fontSize="11" fill="#8b5cf6">◆ GLYPHLOCK PLATFORM · ISOLATED FROM VENUE OPERATIONS ◆</text>
                  <g transform="translate(110, 130)"><rect width="260" height="80" fill="url(#panel-grad)" stroke="#8b5cf6" strokeWidth="1.5" /><rect x="0" y="0" width="4" height="80" fill="#8b5cf6" /><text className="svg-tag" x="20" y="24" fontSize="10" fill="#8b5cf6">⬢ GOVERNANCE</text><text className="svg-title" x="20" y="46" fontSize="14">DACO Master Covenant</text><text className="svg-mono" x="20" y="62" fontSize="9">71 clauses · Carlo authority</text><text className="svg-mono" x="20" y="74" fontSize="9" fill="#a855f7">USPTO 18/584,961</text></g>
                  <g transform="translate(390, 130)"><rect width="260" height="80" fill="url(#panel-grad)" stroke="#8b5cf6" strokeWidth="1.5" /><rect x="0" y="0" width="4" height="80" fill="#8b5cf6" /><text className="svg-tag" x="20" y="24" fontSize="10" fill="#8b5cf6">⬢ IP VAULT</text><text className="svg-title" x="20" y="46" fontSize="14">Steganographic Engine</text><text className="svg-mono" x="20" y="62" fontSize="9">QR glyph generation · sealed</text><text className="svg-mono" x="20" y="74" fontSize="9" fill="#a855f7">platform-owned · licensed out</text></g>
                  <g transform="translate(670, 130)"><rect width="260" height="80" fill="url(#panel-grad)" stroke="#8b5cf6" strokeWidth="1.5" /><rect x="0" y="0" width="4" height="80" fill="#8b5cf6" /><text className="svg-tag" x="20" y="24" fontSize="10" fill="#8b5cf6">⬢ AUDIT · PLATFORM</text><text className="svg-title" x="20" y="46" fontSize="14">AuditEvent</text><text className="svg-mono" x="20" y="62" fontSize="9">venue_id optional · security</text><text className="svg-mono" x="20" y="74" fontSize="9" fill="#a855f7">platform telemetry</text></g>
                  <g transform="translate(950, 130)"><rect width="260" height="80" fill="url(#panel-grad)" stroke="#8b5cf6" strokeWidth="1.5" /><rect x="0" y="0" width="4" height="80" fill="#8b5cf6" /><text className="svg-tag" x="20" y="24" fontSize="10" fill="#8b5cf6">⬢ ACCESS MATRIX</text><text className="svg-title" x="20" y="46" fontSize="14">7-Tier RBAC</text><text className="svg-mono" x="20" y="62" fontSize="9">Admin → Guest scopes</text><text className="svg-mono" x="20" y="74" fontSize="9" fill="#a855f7">venue_id gated</text></g>
                  <g transform="translate(1230, 130)"><rect width="260" height="80" fill="url(#panel-grad)" stroke="#a855f7" strokeWidth="2" /><rect x="0" y="0" width="4" height="80" fill="#a855f7" /><text className="svg-tag" x="20" y="24" fontSize="10" fill="#a855f7">⬢ DISPUTE SHIELD</text><text className="svg-title" x="20" y="46" fontSize="14">One-Push Package</text><text className="svg-mono" x="20" y="62" fontSize="9">pre-empts chargebacks</text><text className="svg-mono" x="20" y="74" fontSize="9" fill="#c4b5fd">evidence-first routing</text></g>
                  <g transform="translate(110, 230)"><rect width="380" height="70" fill="url(#panel-grad)" stroke="#1e2a5c" /><rect x="0" y="0" width="4" height="70" fill="#fbbf24" /><text className="svg-tag" x="20" y="22" fontSize="9" fill="#fbbf24">⬢ SANDBOX · NON-PROD</text><text className="svg-serif" x="20" y="42" fontSize="13">Demo · Training · Underwriting</text><text className="svg-mono" x="20" y="58" fontSize="8" fill="#7c8db8">investor walkthroughs · venue onboarding · QA</text></g>
                  <g transform="translate(510, 230)"><rect width="260" height="70" fill="url(#panel-grad)" stroke="#1e2a5c" /><rect x="0" y="0" width="4" height="70" fill="#10b981" /><text className="svg-tag" x="20" y="22" fontSize="9" fill="#10b981">⬢ REAL · PRODUCTION</text><text className="svg-serif" x="20" y="42" fontSize="13">sk_live_ · settled tx</text><text className="svg-mono" x="20" y="58" fontSize="8" fill="#7c8db8">live venue · real money</text></g>
                  <g transform="translate(790, 230)"><rect width="260" height="70" fill="url(#panel-grad)" stroke="#1e2a5c" /><rect x="0" y="0" width="4" height="70" fill="#3b82f6" /><text className="svg-tag" x="20" y="22" fontSize="9" fill="#3b82f6">⬢ DEMO · TEST</text><text className="svg-serif" x="20" y="42" fontSize="13">sk_test_ · simulated</text><text className="svg-mono" x="20" y="58" fontSize="8" fill="#7c8db8">no settlement · safe</text></g>
                  <g transform="translate(1070, 230)"><rect width="420" height="70" fill="url(#panel-grad)" stroke="#1e2a5c" /><rect x="0" y="0" width="4" height="70" fill="#8b5cf6" /><text className="svg-tag" x="20" y="22" fontSize="9" fill="#8b5cf6">⬢ DEV · SANDBOX</text><text className="svg-serif" x="20" y="42" fontSize="13">Engineering · feature flags · underwriting preview</text><text className="svg-mono" x="20" y="58" fontSize="8" fill="#7c8db8">isolated DB · reset nightly · no real PII</text></g>
                </g>
                <g><rect x="60" y="335" width="1480" height="8" fill="url(#isolation)" /><text className="svg-mono" x="800" y="357" textAnchor="middle" fontSize="9" fill="#ef4444" letterSpacing="0.3em">◆ PLATFORM / VENUE ISOLATION BARRIER · TENANT SEPARATION ENFORCED ◆</text></g>
                <g>
                  <rect x="80" y="380" width="1440" height="540" fill="url(#venue-grad)" stroke="#00d4ff" strokeWidth="1" strokeDasharray="6 3" rx="4" opacity="0.5" />
                  <text className="svg-tag" x="98" y="410" fontSize="11" fill="#00d4ff">◆ VENUE OPERATIONS · TENANT-SCOPED via venue_id ◆</text>

                  <g transform="translate(800, 650)">
                    <g style={{ transformOrigin: 'center', animation: 'spin-slow 40s linear infinite' }}>
                      <circle cx="0" cy="0" r="230" fill="none" stroke="#00d4ff" strokeWidth="0.5" strokeDasharray="1 8" opacity="0.3" />
                      <circle cx="230" cy="0" r="3" fill="#00d4ff" className="orbit-glow" />
                      <circle cx="-230" cy="0" r="3" fill="#8b5cf6" className="orbit-glow" />
                    </g>
                    <g style={{ transformOrigin: 'center', animation: 'spin-reverse 30s linear infinite' }}>
                      <circle cx="0" cy="0" r="210" fill="none" stroke="#8b5cf6" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.3" />
                      <circle cx="0" cy="-210" r="3" fill="#1e6fff" className="orbit-glow" />
                      <circle cx="0" cy="210" r="3" fill="#14b8a6" className="orbit-glow" />
                    </g>
                    <polygon points="0,-200 173,-100 173,100 0,200 -173,100 -173,-100" fill="url(#core-glow)" stroke="#00d4ff" strokeWidth="2.5" />
                    <polygon points="0,-160 139,-80 139,80 0,160 -139,80 -139,-80" fill="none" stroke="#00d4ff" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                    <polygon points="0,-120 104,-60 104,60 0,120 -104,60 -104,-60" fill="#030614" stroke="#1e6fff" strokeWidth="1.5" />
                    <image
                      href="https://media.base44.com/images/public/697a087fb354faebb72df54b/ac7def988_d8c1c28f-21e9-47c1-99ac-394132e7c9ce.png"
                      x="-80"
                      y="-90"
                      width="160"
                      height="160"
                      preserveAspectRatio="xMidYMid meet"
                      className="nups-logo-core"
                    />
                    <text className="svg-title" x="0" y="110" textAnchor="middle" fontSize="22">CORE</text>
                    <text className="svg-mono" x="0" y="130" textAnchor="middle" fontSize="9" fill="#7c8db8">venue_id → tenant</text>
                    <text className="svg-mono" x="0" y="146" textAnchor="middle" fontSize="9" fill="#00d4ff">Multi-Venue Runtime</text>
                    <circle className="pulse-node" cx="0" cy="-200" r="4" fill="#00d4ff" />
                    <circle className="pulse-node" cx="173" cy="-100" r="4" fill="#1e6fff" style={{ animationDelay: '.35s' }} />
                    <circle className="pulse-node" cx="173" cy="100" r="4" fill="#6366f1" style={{ animationDelay: '.7s' }} />
                    <circle className="pulse-node" cx="0" cy="200" r="4" fill="#8b5cf6" style={{ animationDelay: '1.05s' }} />
                    <circle className="pulse-node" cx="-173" cy="100" r="4" fill="#14b8a6" style={{ animationDelay: '1.4s' }} />
                    <circle className="pulse-node" cx="-173" cy="-100" r="4" fill="#3b82f6" style={{ animationDelay: '1.75s' }} />
                  </g>

                  <g transform="translate(110, 440)"><rect width="260" height="70" fill="url(#panel-grad)" stroke="#1e2a5c" /><rect x="0" y="0" width="3" height="70" fill="#00d4ff" /><text className="svg-tag" x="16" y="22" fontSize="9">⬢ GUEST PROFILE</text><text className="svg-serif" x="16" y="42" fontSize="13">Mag-swipe → Account</text><text className="svg-mono" x="16" y="58" fontSize="9" fill="#7c8db8">search: card · QR · name · addr</text></g>
                  <g transform="translate(110, 525)"><rect width="260" height="70" fill="url(#panel-grad)" stroke="#1e2a5c" /><rect x="0" y="0" width="3" height="70" fill="#00d4ff" /><text className="svg-tag" x="16" y="22" fontSize="9">⬢ DRIVER ONBOARDING</text><text className="svg-serif" x="16" y="42" fontSize="13">Profile + QR issued</text><text className="svg-mono" x="16" y="58" fontSize="9" fill="#00d4ff">scan → parametric payout</text></g>
                  <g transform="translate(110, 610)"><rect width="260" height="70" fill="url(#panel-grad)" stroke="#ef4444" strokeWidth="1.5" /><rect x="0" y="0" width="3" height="70" fill="#ef4444" /><text className="svg-tag" x="16" y="22" fontSize="9" fill="#ef4444">⬢ ENTERTAINER · ISOLATED</text><text className="svg-serif" x="16" y="42" fontSize="13">1099 · separate ledger</text><text className="svg-mono" x="16" y="58" fontSize="9" fill="#ef4444">NO tip pool · NO payroll</text></g>
                  <g transform="translate(110, 695)"><rect width="260" height="70" fill="url(#panel-grad)" stroke="#1e2a5c" /><rect x="0" y="0" width="3" height="70" fill="#00d4ff" /><text className="svg-tag" x="16" y="22" fontSize="9">⬢ STAFF CLOCK-IN / OUT</text><text className="svg-serif" x="16" y="42" fontSize="13">Biometric + Shift Log</text><text className="svg-mono" x="16" y="58" fontSize="9" fill="#7c8db8">hours · breaks · OT calc</text></g>
                  <g transform="translate(110, 780)"><rect width="260" height="70" fill="url(#panel-grad)" stroke="#1e2a5c" /><rect x="0" y="0" width="3" height="70" fill="#00d4ff" /><text className="svg-tag" x="16" y="22" fontSize="9">⬢ VIP CONTRACT</text><text className="svg-serif" x="16" y="42" fontSize="13">Click-wrap + 30s Video</text><text className="svg-mono" x="16" y="58" fontSize="9">20-Q spender · QR = receipt</text></g>

                  <g transform="translate(1230, 440)"><rect width="260" height="70" fill="url(#panel-grad)" stroke="#1e2a5c" /><rect x="257" y="0" width="3" height="70" fill="#1e6fff" /><text className="svg-tag" x="16" y="22" fontSize="9">⬢ PAYMENT ROUTER</text><text className="svg-serif" x="16" y="42" fontSize="13">Stripe · GoDaddy · Custom</text><text className="svg-mono" x="16" y="58" fontSize="9" fill="#1e6fff">processor-agnostic</text></g>
                  <g transform="translate(1230, 525)"><rect width="260" height="70" fill="url(#panel-grad)" stroke="#1e2a5c" /><rect x="257" y="0" width="3" height="70" fill="#1e6fff" /><text className="svg-tag" x="16" y="22" fontSize="9">⬢ POS CATALOG</text><text className="svg-serif" x="16" y="42" fontSize="13">Drinks · Bottles · Cover</text><text className="svg-mono" x="16" y="58" fontSize="9" fill="#7c8db8">total = cash + card ONLY</text></g>
                  <g transform="translate(1230, 610)"><rect width="260" height="70" fill="url(#panel-grad)" stroke="#00d4ff" strokeWidth="1.5" /><rect x="257" y="0" width="3" height="70" fill="#00d4ff" /><text className="svg-tag" x="16" y="22" fontSize="9">⬢ GLYPHBUCKS · SVC</text><text className="svg-serif" x="16" y="42" fontSize="13">Closed-Loop Currency</text><text className="svg-mono" x="16" y="58" fontSize="9" fill="#00d4ff">QR = tx_id = contract_id</text></g>
                  <g transform="translate(1230, 695)"><rect width="260" height="70" fill="url(#panel-grad)" stroke="#1e2a5c" /><rect x="257" y="0" width="3" height="70" fill="#6366f1" /><text className="svg-tag" x="16" y="22" fontSize="9">⬢ PAYOUT ENGINE</text><text className="svg-serif" x="16" y="42" fontSize="13">Driver · Staff · Tip Pool</text><text className="svg-mono" x="16" y="58" fontSize="9" fill="#10b981">per-venue parametric</text></g>
                  <g transform="translate(1230, 780)"><rect width="260" height="70" fill="url(#panel-grad)" stroke="#8b5cf6" strokeWidth="1.5" /><rect x="257" y="0" width="3" height="70" fill="#8b5cf6" /><text className="svg-tag" x="16" y="22" fontSize="9" fill="#8b5cf6">⬢ SYSTEMAUDITLOG</text><text className="svg-serif" x="16" y="42" fontSize="13">Financial · Operational</text><text className="svg-mono" x="16" y="58" fontSize="9" fill="#8b5cf6">venue-scoped · immutable</text></g>

                  <g strokeWidth="1" fill="none">
                    <path className="flow-animate" d="M 370 475 L 627 560" stroke="#00d4ff" markerEnd="url(#a-cyan)" />
                    <path className="flow-animate" d="M 370 560 L 627 590" stroke="#00d4ff" markerEnd="url(#a-cyan)" />
                    <path className="flow-animate" d="M 370 645 L 627 640" stroke="#ef4444" strokeDasharray="3 3" markerEnd="url(#a-cyan)" opacity="0.6" />
                    <path className="flow-animate" d="M 370 730 L 627 680" stroke="#00d4ff" markerEnd="url(#a-cyan)" />
                    <path className="flow-animate" d="M 370 815 L 627 720" stroke="#00d4ff" markerEnd="url(#a-cyan)" />
                  </g>

                  <g strokeWidth="1" fill="none">
                    <path className="flow-animate" d="M 973 560 L 1230 475" stroke="#1e6fff" markerEnd="url(#a-sapph)" />
                    <path className="flow-animate" d="M 973 590 L 1230 560" stroke="#1e6fff" markerEnd="url(#a-sapph)" />
                    <path className="flow-animate" d="M 973 640 L 1230 645" stroke="#00d4ff" strokeWidth="1.5" markerEnd="url(#a-cyan)" />
                    <path className="flow-animate" d="M 973 680 L 1230 730" stroke="#6366f1" markerEnd="url(#a-indigo)" />
                    <path className="flow-animate" d="M 973 720 L 1230 815" stroke="#8b5cf6" markerEnd="url(#a-violet)" />
                  </g>

                  <path d="M 800 320 L 800 450" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="6 8" fill="none" markerEnd="url(#a-violet)" opacity="0.7">
                    <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="2.4s" repeatCount="indefinite" />
                  </path>
                  <text className="svg-mono" x="810" y="390" fontSize="9" fill="#8b5cf6">policy · scope · access</text>
                </g>
                <g transform="translate(800, 1048)">
                  <rect x="-640" y="0" width="1280" height="58" fill="#07091c" stroke="#1e2a5c" opacity="0.95" />
                  <text className="svg-tag" x="-610" y="22" fontSize="8" fill="#00d4ff">◆ RUNTIME CONTROLS ◆</text>
                  <text className="svg-mono" x="-610" y="40" fontSize="8" fill="#7c8db8">REAL · DEMO · SANDBOX · venue_id enforced · RLS active · signed media chain</text>
                  <text className="svg-tag" x="40" y="22" fontSize="8" fill="#8b5cf6">◆ EVIDENCE STACK ◆</text>
                  <text className="svg-mono" x="40" y="40" fontSize="8" fill="#7c8db8">printed contract · manager signature · hostess signature · scan-back archive · receipt · QR · blockchain hash</text>
                </g>
                <g transform="translate(800, 1120)">
                  <rect x="-640" y="0" width="1280" height="46" fill="#07091c" stroke="#1e2a5c" opacity="0.95" />
                  <text className="svg-tag" x="0" y="18" textAnchor="middle" fontSize="9" fill="#7c8db8">DACO MASTER COVENANT · 71 CLAUSES · USPTO 18/584,961 · AZ #23831258</text>
                  <text className="svg-mono" x="0" y="34" textAnchor="middle" fontSize="8" fill="#3d4a7a">total_sales = cash + card · entertainers 1099-isolated · hardcopy archived for bookkeeping/litigation · one-push dispute shield enabled</text>
                </g>
              </svg>
            </div>

            <div className="legend">
              <span><i className="ctrl" /> Platform Policy</span>
              <span><i className="data" /> Identity · Data</span>
              <span><i className="tx" /> Commerce · TX</span>
              <span><i className="audit" /> Audit · Evidence</span>
              <span><i className="chain" /> Blockchain Attest</span>
              <span><i className="isolate" /> Isolation Barrier</span>
            </div>
          </div>

          <div className="section-header"><h2>Stakeholder <b>Protection</b></h2><div className="index">§ 02 · High-Risk Mitigation</div></div>
          <div className="protection-section">
            <div className="protection-intro">
              <span className="eyebrow">◆ Evidence-Driven Infrastructure</span>
              <h3>Bad business becomes <span className="glow">self-evident.</span></h3>
              <p>Adult entertainment, nightlife, and cash-heavy venues are flagged <b>high-risk</b> by every processor and bank on earth. The reason isn't the industry — it's the <b>lack of verifiable records</b>. Cash doesn't lie, but it also doesn't prove anything. NUPS changes the calculus: every transaction arrives pre-evidenced, pre-consented, pre-attested. Each stakeholder — bank, processor, venue, guest — gets cryptographic proof that the business happened, that it was consensual, and that it was clean.</p>
            </div>
            <div className="stakeholders">
              <div className="stakeholder" style={{ ['--sh-color']: '#00d4ff', ['--sh-glow']: 'rgba(0,212,255,0.2)' }}><div className="label">Protecting</div><h4>The Bank</h4><div className="risk"><em>Without NUPS</em>Underwrites blind. High reserves, MATCH-list exposure, surprise reversals.</div><div className="benefit"><em>With NUPS</em>Pre-sealed evidence on every tx. Lower reserves, lower MATCH risk, clean KYC/AML trail.</div></div>
              <div className="stakeholder" style={{ ['--sh-color']: '#1e6fff', ['--sh-glow']: 'rgba(30,111,255,0.2)' }}><div className="label">Protecting</div><h4>The Processor</h4><div className="risk"><em>Without NUPS</em>Absorbs chargeback losses. Pays fee arbitration, rep costs, scheme fines.</div><div className="benefit"><em>With NUPS</em>Disputes pre-empted before the chargeback cycle. Fee ratio drops. Merchant stays in good standing.</div></div>
              <div className="stakeholder" style={{ ['--sh-color']: '#8b5cf6', ['--sh-glow']: 'rgba(139,92,246,0.2)' }}><div className="label">Protecting</div><h4>The Venue</h4><div className="risk"><em>Without NUPS</em>Cash shrinkage, tip-pool disputes, contract claims, regulatory exposure.</div><div className="benefit"><em>With NUPS</em>Closed-loop ledger. Every dollar attributed. Every contract sealed. Every claim defended.</div></div>
              <div className="stakeholder" style={{ ['--sh-color']: '#a855f7', ['--sh-glow']: 'rgba(168,85,247,0.2)' }}><div className="label">Protecting</div><h4>The Guest</h4><div className="risk"><em>Without NUPS</em>No receipt, no recourse. Informal agreements, ambiguous terms, zero privacy control.</div><div className="benefit"><em>With NUPS</em>Signed contract + video + receipt = guest has full record. Consent is documented and revocable.</div></div>
            </div>
          </div>

          <div className="tier-section">
            <div className="section-header"><h2>Access <b>Matrix</b> — 7 Tiers</h2><div className="index">§ 03 · RBAC</div></div>
            <div className="tier-grid">
              <div className="tier" style={{ ['--tier-color']: '#a855f7' }}><div className="rank">TIER <em>00</em></div><h4>Admin</h4><ul><li>All venues</li><li>Platform config</li><li>Billing / invoices</li><li>Role provisioning</li><li>Mode switch</li></ul></div>
              <div className="tier" style={{ ['--tier-color']: '#8b5cf6' }}><div className="rank">TIER <em>01</em></div><h4>Owner</h4><ul><li>Own venue(s) only</li><li>Full financials</li><li>Contracts access</li><li>Hire / fire staff</li><li>Dispute packages</li></ul></div>
              <div className="tier" style={{ ['--tier-color']: '#6366f1' }}><div className="rank">TIER <em>02</em></div><h4>Venue Mgr</h4><ul><li>Single venue ops</li><li>Staff clock-in/out</li><li>Shift reports</li><li>Sign contracts</li><li>Print GlyphBucks</li></ul></div>
              <div className="tier" style={{ ['--tier-color']: '#3b82f6' }}><div className="rank">TIER <em>03</em></div><h4>Staff</h4><ul><li>POS · bar · door</li><li>Own shift data</li><li>Tip pool visible</li><li>Clock self in/out</li><li>No financials</li></ul></div>
              <div className="tier" style={{ ['--tier-color']: '#00d4ff' }}><div className="rank">TIER <em>04</em></div><h4>Entertainer</h4><ul><li>Own earnings</li><li>Own hours</li><li>Own contracts</li><li>Biometric check-in</li><li>1099 tax docs</li></ul></div>
              <div className="tier" style={{ ['--tier-color']: '#14b8a6' }}><div className="rank">TIER <em>05</em></div><h4>Driver</h4><ul><li>Own QR code</li><li>Guest count log</li><li>Own payouts</li><li>Scan-only interface</li><li>No venue data</li></ul></div>
              <div className="tier" style={{ ['--tier-color']: '#22d3ee' }}><div className="rank">TIER <em>06</em></div><h4>Guest</h4><ul><li>Own profile</li><li>Own contracts</li><li>Receipt lookup</li><li>GlyphBucks balance</li><li>Consent mgmt</li></ul></div>
            </div>
          </div>

          <div className="section-header"><h2>Dispute <b>Shield</b> — One-Push Package</h2><div className="index">§ 04 · Chargeback Defense</div></div>
          <div className="shield-section">
            <div className="shield-copy">
              <span className="eyebrow">◆ Pre-Empts the Chargeback Cycle</span>
              <h3>Stop the dispute <span className="glow">before it starts.</span></h3>
              <p>NUPS builds the evidence packet in real-time. Every transaction accrues its own <b>chain of custody</b> as it happens — contract, video attestation, biometrics, still frames, receipt, ledger entry, blockchain timestamp.</p>
              <p>When a claim lands, one button assembles the package and routes it directly to the venue's <b>banking partner</b>. The processor sees a fully attested transaction with consented, biometrically-verified proof before the dispute cycle ever engages.</p>
              <p>For high-risk merchants, this is the difference between <b>operating in good standing</b> and losing the merchant account entirely.</p>

            </div>
            <div className="shield-package">
              <div className="pkg-header"><span className="name">Evidence Package</span><span className="id">PKG-<span style={{ color: 'var(--cyan)' }}>TX_9F2A4C</span></span></div>
              <ul className="contents">
                <li><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M 14 2 H 6 a 2 2 0 0 0 -2 2 v 16 a 2 2 0 0 0 2 2 h 12 a 2 2 0 0 0 2 -2 V 8 z" /><path d="M 14 2 v 6 h 6" /></svg></span><span className="txt">Signed contract (PDF + SHA-256 hash)</span><span className="status">✓ SEALED</span></li>
                <li><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg></span><span className="txt">30-sec video attestation</span><span className="status">✓ SEALED</span></li>
                <li><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="13" r="3" /><path d="M 23 19 a 2 2 0 0 1 -2 2 H 3 a 2 2 0 0 1 -2 -2 V 8 a 2 2 0 0 1 2 -2 h 4 l 2 -3 h 6 l 2 3 h 4 a 2 2 0 0 1 2 2 z" /></svg></span><span className="txt">Still frames × 5 (pre / during / post)</span><span className="status">✓ SEALED</span></li>
                <li><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M 9 11 L 7 13 M 17 11 L 15 13" /><path d="M 12 19 a 5 5 0 0 1 -5 -5 V 8 a 5 5 0 0 1 10 0 v 6 a 5 5 0 0 1 -5 5 z" /></svg></span><span className="txt">Fingerprint biometric match</span><span className="status">✓ SEALED</span></li>
                <li><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M 3 3 h 18 v 18 H 3 z M 3 9 h 18 M 9 3 v 18" /></svg></span><span className="txt">POS receipt + GlyphBucks QR</span><span className="status">✓ SEALED</span></li>
                <li><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M 4 6 L 12 2 L 20 6 V 14 C 20 18 16 21 12 22 C 8 21 4 18 4 14 Z" /><path d="M 9 12 L 11 14 L 15 10" /></svg></span><span className="txt">Blockchain timestamp hash</span><span className="status">✓ SEALED</span></li>
                <li><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M 21 11.5 a 8.38 8.38 0 0 1 -.9 3.8 a 8.5 8.5 0 0 1 -7.6 4.7 a 8.38 8.38 0 0 1 -3.8 -.9 L 3 21 l 1.9 -5.7 a 8.38 8.38 0 0 1 -.9 -3.8 a 8.5 8.5 0 0 1 4.7 -7.6 a 8.38 8.38 0 0 1 3.8 -.9 h .5 a 8.48 8.48 0 0 1 8 8 v .5 z" /></svg></span><span className="txt">Click-wrap consent log</span><span className="status">✓ SEALED</span></li>
              </ul>
            </div>
          </div>

          <div className="section-header"><h2>Driver <b>Payout</b> — Parametric Example</h2><div className="index">§ 05 · Formula</div></div>
          <div className="payout-section">
            <div className="payout-wrap">
              <div className="payout-copy">
                <h3>One formula. <b>Every venue.</b></h3>
                <p>NUPS doesn't hardcode driver economics. Each venue supplies its own <b>rate card</b> — cover amount, card discount, per-guest driver payout, any bonus tiers — and the engine computes net cash due on every scan.</p>
                <p>The example shown uses illustrative rates. Real venues set their own numbers in configuration.</p>
                <div className="note"><em>Formula</em>NET_DUE = (COVER − CARD_DISC) × N − PAYOUT_PER_GUEST × N ± BONUS_TIER</div>
              </div>
              <div className="payout-viz">
                <div className="title"><span>EXAMPLE · 4 GUESTS ARRIVED WITH DRIVER #D-2271</span><span className="badge">SIMULATED</span></div>
                <div className="payout-flow">
                  <div className="payout-node" style={{ ['--node-color']: '#00d4ff' }}><span className="n-var">$COVER</span><div className="n-label">Cover × 4</div><div className="n-val">$80</div><div className="n-sub">base gate intake</div></div>
                  <div className="payout-arrow">▶<span className="op">minus</span></div>
                  <div className="payout-node" style={{ ['--node-color']: '#fbbf24' }}><span className="n-var">$PAYOUT</span><div className="n-label">Driver × 4</div><div className="n-val">$60</div><div className="n-sub">per-guest payout</div></div>
                  <div className="payout-arrow">▶<span className="op">net</span></div>
                  <div className="payout-node" style={{ ['--node-color']: '#10b981' }}><span className="n-var">NET</span><div className="n-label">House Net</div><div className="n-val">$20</div><div className="n-sub">to venue ledger</div></div>
                </div>
                <div className="payout-legend">
                  <div className="item"><em>Rate Card</em><b>Cover</b>, <b>card discount</b>, <b>per-guest payout</b>, and <b>bonus tiers</b> are all venue-configurable.</div>
                  <div className="item"><em>Variables</em><b>N</b> = guest count · <b>$COVER</b> = gate · <b>$PAYOUT</b> = driver per head · tiered bonuses allowed.</div>
                  <div className="item"><em>Settlement</em>Netted at scan. Cash drawer updates in real-time. Driver statement emailed via SendGrid.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="section-header"><h2>Under the <b>Hood</b></h2><div className="index">§ 06 · Hardware · Software · Data</div></div>
          <div className="tech-stack">
            <div className="tech-tabs">
              <div className="tech-tab" style={{ ['--tab-color']: '#00d4ff' }}>
                <div className="tab-head"><div className="icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M 6 8 L 10 8 M 6 12 L 10 12 M 6 16 L 10 16 M 14 8 L 18 8 M 14 12 L 18 12 M 14 16 L 18 16" /></svg></div><div className="num">01</div></div>
                <h4>Hardware<em>Edge Compute Stack</em></h4>
                <ul>
                  <li><span className="k">COMPUTE</span><span className="v"><b>Raspberry Pi 500+</b> — BCM2712, quad A76 @ 2.4GHz, 16GB LPDDR4X, 256GB NVMe. Wi-Fi 6, BT 5.2, dual 4K micro-HDMI. <em>~$200 per node</em></span></li>
                  <li><span className="k">DISPLAY</span><span className="v"><b>15&quot; portable touch</b> — 1080p IPS, 10-point capacitive, USB-C powered. Guest-facing for click-wrap signing. <em>Swappable per station</em></span></li>
                  <li><span className="k">MOBILE</span><span className="v"><b>Samsung tablet</b> with AT&amp;T SIM — LTE fallback for outages, roaming door/floor staff terminal. <em>DeX + HDMI bridge</em></span></li>
                  <li><span className="k">CAPTURE</span><span className="v"><b>Adesso biometric</b> + USB mag-stripe + chip reader + barcode/QR scanner + webcam. Full edge identity capture. <em>Plug-and-play USB</em></span></li>
                  <li><span className="k">PRINT</span><span className="v">Epson wireless PDF scanner, ET-5850 contracts, thermal receipts, <b>SVC machine</b> for GlyphBucks. <em>Role-specific print routes</em></span></li>
                  <li><span className="k">NETWORK</span><span className="v">Dual-path: venue Wi-Fi primary + AT&amp;T LTE failover. Offline mode buffers to MongoDB fallback until reconnect. <em>Zero-downtime spec</em></span></li>
                </ul>
              </div>
              <div className="tech-tab" style={{ ['--tab-color']: '#8b5cf6' }}>
                <div className="tab-head"><div className="icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg></div><div className="num">02</div></div>
                <h4>Software<em>Platform Runtime</em></h4>
                <ul>
                  <li><span className="k">PLATFORM</span><span className="v"><b>Base44</b> app shell — App ID <code style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'var(--cyan)' }}>697a087fb354faebb72df54b</code>. Multi-tenant by venue_id. <em>REAL · DEMO · SANDBOX modes</em></span></li>
                  <li><span className="k">AUTH</span><span className="v"><b>Auth0 + JWT</b> — 7-tier RBAC, MFA-enforced for Tier 00–02, venue-scoped tokens. <em>Role expires at shift end</em></span></li>
                  <li><span className="k">COMMS</span><span className="v"><b>SendGrid</b> (email: contracts, receipts, 1099s) + <b>Twilio</b> (SMS: OTP, driver alerts, shift notifications). <em>Templated + tracked</em></span></li>
                  <li><span className="k">PAYMENTS</span><span className="v"><b>Processor-agnostic router</b>: Stripe, GoDaddy, or venue's existing merchant. Card whitelist enforced server-side. <em>Swap without redeployment</em></span></li>
                  <li><span className="k">CURRENCY</span><span className="v"><b>GlyphBucks SVC engine</b> — closed-loop stored-value with steganographic QR, denominations $10–$1000 (customizable). <em>Not a crypto · not a gift card</em></span></li>
                  <li><span className="k">SHIELD</span><span className="v"><b>Dispute evidence compiler</b> — bundles contract, video, biometric, receipt, blockchain hash into a single signed PDF package on demand. <em>One button · full chain</em></span></li>
                  <li><span className="k">GOVERNANCE</span><span className="v"><b>DACO enforcement layer</b> — immutable rules (total_sales = cash + card ONLY, 1099 isolation, tip pass-through). <em>Code-level guards · not config</em></span></li>
                </ul>
              </div>
              <div className="tech-tab" style={{ ['--tab-color']: '#14b8a6' }}>
                <div className="tab-head"><div className="icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M 3 5 v 14 a 9 3 0 0 0 18 0 V 5" /><path d="M 3 12 a 9 3 0 0 0 18 0" /></svg></div><div className="num">03</div></div>
                <h4>Data<em>Storage · Audit · Chain</em></h4>
                <ul>
                  <li><span className="k">PRIMARY</span><span className="v"><b>Supabase Postgres</b> with row-level security. Tables: GlyphBucksOrder, VIPContract, Shift, Payout, TipPool, AuditLog. <em>Realtime subscriptions + edge functions</em></span></li>
                  <li><span className="k">FALLBACK</span><span className="v"><b>MongoDB</b> — offline document store for network outages. Idempotent sync-on-reconnect with conflict resolution. <em>Never lose a transaction</em></span></li>
                  <li><span className="k">AUDIT · OPS</span><span className="v"><b>SystemAuditLog</b> — financial + operational events. <code style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'var(--cyan)' }}>venue_id REQUIRED</code>. Immutable append-only. <em>Venue-scoped tenant separation</em></span></li>
                  <li><span className="k">AUDIT · PLAT</span><span className="v"><b>AuditEvent</b> — platform + security telemetry. <code style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'var(--cyan)' }}>venue_id optional</code>. <em>For GlyphLock internal forensics</em></span></li>
                  <li><span className="k">CHAIN</span><span className="v"><b>Blockchain timestamping</b> — every contract signature, video attestation, and tx hash anchored to a public chain. <em>Court-admissible chain of custody</em></span></li>
                  <li><span className="k">RETENTION</span><span className="v">Financial records <b>7 years</b>, consent records <b>statutory max</b>, video attestations <b>encrypted at rest, purged on statutory expiry or guest request</b>. <em>GDPR/CCPA compliant</em></span></li>
                  <li><span className="k">ENCRYPTION</span><span className="v">AES-256 at rest, TLS 1.3 in transit, per-venue encryption keys, biometrics hashed (never stored raw). <em>SOC-2 ready</em></span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="section-header"><h2>Guest <b>Flow</b> — Door to VIP</h2><div className="index">§ 07 · Sequence</div></div>
          <div className="flow-section">
            <div className="flow-track">
              <div className="flow-step"><span className="num">01</span><h4>Driver Scan</h4><p>Driver arrives with guests, scans personal QR. System logs guest count, runs venue rate card, computes net payout.</p><span className="trigger">→ BARCODE SCANNER</span></div>
              <div className="flow-step"><span className="num">02</span><h4>ID Swipe</h4><p>Guest swipes ID at door. NUPS creates or retrieves profile — searchable by card, name, address, QR.</p><span className="trigger">→ MAG-STRIPE READER</span></div>
              <div className="flow-step"><span className="num">03</span><h4>Cover + Card</h4><p>Door economics auto-calculated from venue rate card. Payout netted at source before cash drawer updates.</p><span className="trigger">→ STRIPE / GODADDY</span></div>
              <div className="flow-step"><span className="num">04</span><h4>Bar &amp; Bottles</h4><p>POS handles drinks and bottle service. Card whitelist enforced; totals balance cash + card only.</p><span className="trigger">→ POS TERMINAL</span></div>
              <div className="flow-step"><span className="num">05</span><h4>VIP Contract</h4><p>Guest + entertainer sign click-wrap on 15&quot; touch. 30-sec video attestation. Blockchain-timestamped.</p><span className="trigger">→ CONTRACT = RECEIPT</span></div>
              <div className="flow-step"><span className="num">06</span><h4>GlyphBucks Print</h4><p>Manager scans signed contract, SVC prints denominated GlyphBucks. QR on each note links back to tx + profile.</p><span className="trigger">→ SVC PRINTER</span></div>
            </div>
          </div>

          <div className="section-header"><h2>Rate Card &amp; <b>Operations</b></h2><div className="index">§ 08 · Configuration</div></div>
          <div className="split-section">
            <div className="econ-card">
              <span className="card-label">◆ Rate Card · Per Venue</span>
              <h3>Every line <b>configurable.</b></h3>
              <p>Numbers shown are illustrative defaults. Each venue supplies its own rate card during onboarding — cover, discounts, driver payout, bonus tiers, bottle pricing, tip pool split.</p>
              <div className="econ-table">
                <div className="row header"><div className="k">Line Item</div><div className="v">Variable</div></div>
                <div className="row"><div className="k">Cover <em>no card</em></div><div className="v">$COVER</div></div>
                <div className="row"><div className="k">Card discount</div><div className="v">$CARD_DISC</div></div>
                <div className="row"><div className="k">Driver payout <em>per guest</em></div><div className="v">$PAYOUT</div></div>
                <div className="row"><div className="k">Driver bonus <em>tiered</em></div><div className="v">$BONUS_N</div></div>
                <div className="row"><div className="k">Bar drink <em>floor</em></div><div className="v">$DRINK</div></div>
                <div className="row"><div className="k">Bottle service</div><div className="v">$BOTTLE</div></div>
                <div className="row total"><div className="k">Every figure set at venue onboarding</div><div className="v">◆ PARAMETRIC</div></div>
              </div>
            </div>
            <div className="sandbox-card">
              <span className="card-label">◆ Operating Controls</span>
              <h3>Built for <b>controlled execution.</b></h3>
              <p>Every venue runs on a configured operating profile with defined rates, permissions, reconciliation rules, and documented financial controls.</p>
              <div className="sandbox-modes">
                <div className="sandbox-mode" style={{ ['--mode-color']: '#10b981' }}><span className="dot" /><div className="name">Rate Configuration <em>Cover, payouts, pricing, and fee logic per venue</em></div><span className="key">CONFIG</span></div>
                <div className="sandbox-mode" style={{ ['--mode-color']: '#3b82f6' }}><span className="dot" /><div className="name">Permissions Matrix <em>Access scoped by role and operational responsibility</em></div><span className="key">RBAC</span></div>
                <div className="sandbox-mode" style={{ ['--mode-color']: '#8b5cf6' }}><span className="dot" /><div className="name">Reconciliation Rules <em>Cash, card, contracts, and audit outputs stay aligned</em></div><span className="key">LEDGER</span></div>
              </div>
            </div>
          </div>

          <div className="section-header"><h2>What <b>NUPS</b> Replaces</h2><div className="index">§ 09 · Capabilities</div></div>
          <div className="capabilities">
            <div className="cap"><svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M 3 10 L 21 10" /><circle cx="7" cy="15" r="1" fill="currentColor" /></svg><span className="tag">Identity</span><h4>No more paper.</h4><p>Mag-stripe swipe creates a searchable profile instantly. Drivers and entertainers onboard once — scan QR forever.</p></div>
            <div className="cap"><svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M 12 2 L 12 22" /><path d="M 17 6 H 9 a 3 3 0 0 0 0 6 h 6 a 3 3 0 0 1 0 6 H 7" /></svg><span className="tag">Currency</span><h4>GlyphBucks closed-loop.</h4><p>Proprietary SVC issues denominated notes ($10–$1000, customizable). QR on each note ties to contract, tx, and user.</p></div>
            <div className="cap"><svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M 3 9 H 21 M 9 3 V 21" /></svg><span className="tag">Multi-Venue</span><h4>One platform, many rooms.</h4><p>Every venue is a venue_id tenant. Separate data, separate tax, separate payouts — one pane of glass.</p></div>
            <div className="cap"><svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M 4 6 L 12 2 L 20 6 V 14 C 20 18 16 21 12 22 C 8 21 4 18 4 14 Z" /><path d="M 9 12 L 11 14 L 15 10" /></svg><span className="tag">Defense</span><h4>One-push dispute shield.</h4><p>Evidence packet assembled in real-time. One button routes directly to banking partner with sealed proof.</p></div>
            <div className="cap"><svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M 4 21 C 4 16 8 14 12 14 C 16 14 20 16 20 21" /></svg><span className="tag">Entertainer</span><h4>Dancers see their numbers.</h4><p>Self-serve dashboard: nightly, weekly, monthly earnings + hours. 1099-compliant, fully isolated from staff tip pool.</p></div>
            <div className="cap"><svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg><span className="tag">Clock</span><h4>Staff in, staff out.</h4><p>Biometric clock-in/out per shift. Hours, breaks, and OT calculated automatically. Payroll export ready.</p></div>
            <div className="cap"><svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M 6 10 L 10 10 M 6 14 L 14 14" /><circle cx="18" cy="13" r="2" /></svg><span className="tag">Payments</span><h4>Processor-agnostic.</h4><p>Stripe, GoDaddy, or the venue's existing merchant — NUPS routes through whichever is preferred. Swipe, chip, or tap.</p></div>
            <div className="cap"><svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M 12 2 L 3 7 V 12 C 3 17 7 21 12 22 C 17 21 21 17 21 12 V 7 Z" /><path d="M 9 12 L 11 14 L 15 10" /></svg><span className="tag">Compliance</span><h4>Contract is the receipt.</h4><p>Click-wrap signature + 30-second video + printed PDF. Entertainer and guest both attest. Chain of custody, end to end.</p></div>
          </div>

          <section className="footer-cta">
            <h3>The venue is the <span className="glow">network.</span><br />NUPS is the <span className="glow">protocol.</span></h3>
            <p>Infrastructure-grade platform for high-risk entertainment venues. Live deployments across the Phoenix metro. Sandbox access available for qualified operators, investors, and underwriting partners.</p>
            <div className="stamp">GlyphLock LLC · Arizona · USPTO 18/584,961 · Est. 2025 · All Rights Reserved</div>
          </section>
        </div>
      </div>
    </>
  );
}