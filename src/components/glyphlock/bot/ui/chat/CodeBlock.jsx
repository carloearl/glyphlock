import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/** DACO 007 Phase B — branded code block with copy button. */
export default function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');
  const lang = (className || '').replace('language-', '');

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  return (
    <div className="my-2 rounded-lg border border-amber-500/20 bg-slate-950/90 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1 border-b border-white/5 bg-white/[0.03]">
        <span className="text-[10px] uppercase tracking-wider text-amber-400/70 font-mono">{lang || 'code'}</span>
        <button
          onClick={copy}
          title={copied ? 'Copied' : 'Copy code'}
          style={{ minWidth: '32px', minHeight: '32px', touchAction: 'manipulation' }}
          className="flex items-center justify-center gap-1 px-1.5 rounded text-[10px] text-slate-400 hover:text-amber-300 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs leading-relaxed m-0">
        <code className="text-slate-200 font-mono bg-transparent p-0">{code}</code>
      </pre>
    </div>
  );
}