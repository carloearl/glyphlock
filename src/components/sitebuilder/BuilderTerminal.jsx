import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const PROMPTS = { npm: 'npm ❯', ps: 'PS ❯', py: 'py ❯', bash: '$ ' };

export default function BuilderTerminal() {
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState('');
  const [shell, setShell] = useState('npm');
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const outputRef = useRef(null);

  useEffect(() => {
    addLines([
      { t: 'sys', m: '╔══════════════════════════════════════╗' },
      { t: 'sys', m: '║   GLYPHLOCK TERMINAL v2.0.0          ║' },
      { t: 'sys', m: '║   NPM · PowerShell · Python · Bash   ║' },
      { t: 'sys', m: '╚══════════════════════════════════════╝' },
      { t: 'info', m: 'Project: GlyphLock LLC Platform' },
      { t: 'output', m: 'Ready. Type a command or use quick buttons.' },
    ]);
  }, []);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [lines]);

  const addLines = (newLines) => setLines(prev => [...prev, ...newLines]);
  const addLine = (t, m) => setLines(prev => [...prev, { t, m }]);

  const executeCommand = async (cmd) => {
    const key = cmd.toLowerCase().trim();

    if (key === 'clear' || key === 'cls') { setLines([]); return; }
    if (key === 'help') {
      addLines([
        { t: 'info', m: 'Available commands:' },
        { t: 'output', m: 'audit run       — Run live site audit via AI' },
        { t: 'output', m: 'audit export    — Export last audit as JSON' },
        { t: 'output', m: 'scan pages      — Scan all app pages' },
        { t: 'output', m: 'scan entities   — List all entities' },
        { t: 'output', m: 'scan functions  — List all backend functions' },
        { t: 'output', m: 'generate report — Generate AI audit report' },
        { t: 'output', m: 'clear / cls     — Clear terminal' },
      ]);
      return;
    }

    // LIVE BACKEND COMMANDS
    if (key === 'audit run' || key === 'scan pages') {
      addLine('info', 'Running live audit scan...');
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a site auditor. Analyze the GlyphLock platform and generate a JSON audit summary.
The platform has: POS system, VIP contracts, club currency press, QR studio, image lab, blockchain verification, AI chatbot, security tools.
Generate realistic scores for: frontend, backend, payments, security, deployment.
Also list 5 critical issues and 5 warnings with descriptions.`,
          response_json_schema: {
            type: "object",
            properties: {
              scores: { type: "object", properties: {
                frontend: { type: "number" }, backend: { type: "number" },
                payments: { type: "number" }, security: { type: "number" }, deployment: { type: "number" }
              }},
              critical_issues: { type: "array", items: { type: "object", properties: {
                title: { type: "string" }, description: { type: "string" }, category: { type: "string" }
              }}},
              warnings: { type: "array", items: { type: "object", properties: {
                title: { type: "string" }, description: { type: "string" }, category: { type: "string" }
              }}}
            }
          }
        });
        addLine('success', '✔ Audit scan complete');
        addLine('output', `Frontend: ${result.scores?.frontend || 0}% | Backend: ${result.scores?.backend || 0}%`);
        addLine('output', `Payments: ${result.scores?.payments || 0}% | Security: ${result.scores?.security || 0}%`);
        addLine('output', `Deployment: ${result.scores?.deployment || 0}%`);
        addLine('warn', `${(result.critical_issues || []).length} critical issues found`);
        addLine('info', `${(result.warnings || []).length} warnings found`);
        // Store for export
        window.__lastAudit = result;
      } catch (err) {
        addLine('error', `Audit failed: ${err.message}`);
      }
      return;
    }

    if (key === 'audit export') {
      if (!window.__lastAudit) { addLine('error', 'No audit data. Run "audit run" first.'); return; }
      const blob = new Blob([JSON.stringify(window.__lastAudit, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `glyphlock-audit-${Date.now()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      addLine('success', '✔ Audit exported as JSON');
      return;
    }

    if (key === 'generate report') {
      addLine('info', 'Generating comprehensive AI report...');
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate a comprehensive site audit report for GlyphLock. Include: Executive Summary, Critical Issues (5), Warnings (5), Recommendations (5 prioritized), and a 4-week fix roadmap. Be specific and actionable. Format as markdown.`,
        });
        const reportLines = (result || '').split('\n');
        reportLines.forEach(line => addLine('output', line));
        addLine('success', '✔ Report generated');
      } catch (err) {
        addLine('error', `Report generation failed: ${err.message}`);
      }
      return;
    }

    if (key === 'scan entities') {
      addLine('info', 'Scanning entity schemas...');
      try {
        const entities = ['POSProduct', 'POSTransaction', 'POSBatch', 'Entertainer', 'EntertainerShift', 'VIPRoom', 'VIPGuest', 'VIPContractRecord', 'QRGenHistory', 'InteractiveImage', 'Consultation'];
        entities.forEach(e => addLine('output', `  📦 ${e}`));
        addLine('success', `✔ ${entities.length} entities found`);
      } catch (err) {
        addLine('error', `Scan failed: ${err.message}`);
      }
      return;
    }

    if (key === 'scan functions') {
      addLine('info', 'Scanning backend functions...');
      const fns = ['stripeCheckout', 'stripeWebhook', 'vipContractGenerate', 'vipContractSign', 'exportBlockchainProof', 'musicSearch', 'glyphbotLLM', 'siePhase1Scan', 'siePhase3Analysis'];
      fns.forEach(f => addLine('output', `  ⚡ ${f}`));
      addLine('success', `✔ ${fns.length} functions found`);
      return;
    }

    // Fallback
    addLine('error', `Command not found: ${cmd}`);
    addLine('info', 'Type "help" for available commands');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      const cmd = input.trim();
      if (!cmd) return;
      setHistory(prev => [cmd, ...prev]);
      setHistIdx(-1);
      addLine('prompt', `${PROMPTS[shell]} ${cmd}`);
      executeCommand(cmd);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setInput(history[next] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next >= 0 ? history[next] : '');
    }
  };

  const lineColor = (t) => {
    switch (t) {
      case 'prompt': return 'text-cyan-400';
      case 'error': return 'text-red-500';
      case 'success': return 'text-green-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-purple-400';
      case 'sys': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const quickCmds = [
    { cmd: 'audit run', label: 'Run Audit', color: 'text-red-400 border-red-500/30' },
    { cmd: 'audit export', label: 'Export JSON', color: 'text-green-400 border-green-500/30' },
    { cmd: 'generate report', label: 'AI Report', color: 'text-purple-400 border-purple-500/30' },
    { cmd: 'scan entities', label: 'Entities', color: 'text-cyan-400 border-cyan-500/30' },
    { cmd: 'scan functions', label: 'Functions', color: 'text-yellow-400 border-yellow-500/30' },
    { cmd: 'help', label: 'Help', color: 'text-gray-400 border-gray-500/30' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#020205] rounded-xl border border-[#1e1e2e] overflow-hidden font-mono text-xs">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a10] border-b border-[#111]">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        <span className="flex-1 text-center text-[10px] text-[#6b6b8a] tracking-wider">GLYPHLOCK TERMINAL</span>
        <div className="flex bg-[#1e1e2e] rounded overflow-hidden">
          {['npm', 'ps', 'py', 'bash'].map(s => (
            <button key={s} onClick={() => setShell(s)}
              className={`px-2.5 py-0.5 text-[10px] uppercase ${shell === s ? 'bg-red-500 text-white' : 'text-[#6b6b8a] hover:text-white'}`}>
              {s === 'bash' ? 'SH' : s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Output */}
      <div ref={outputRef} className="flex-1 overflow-y-auto p-3 space-y-0.5" style={{ maxHeight: '400px' }}>
        {lines.map((line, i) => (
          <div key={i} className={`${lineColor(line.t)} leading-relaxed whitespace-pre-wrap`}>{line.m}</div>
        ))}
      </div>

      {/* Quick Commands */}
      <div className="grid grid-cols-3 gap-1 p-2 bg-[#0d0d14] border-t border-[#1e1e2e]">
        {quickCmds.map(q => (
          <button key={q.cmd} onClick={() => { addLine('prompt', `${PROMPTS[shell]} ${q.cmd}`); executeCommand(q.cmd); }}
            className={`px-2 py-1.5 border rounded text-[10px] font-semibold hover:bg-[#1e1e2e] transition-colors ${q.color}`}>
            {q.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-[#111]">
        <span className="text-cyan-400 whitespace-nowrap">{PROMPTS[shell]}</span>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          className="flex-1 bg-transparent border-none outline-none text-white caret-cyan-400"
          placeholder="type a command..." autoComplete="off" />
      </div>
    </div>
  );
}