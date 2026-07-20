import React, { useState } from 'react';

export default function AIConsole(props) {
  const {
    selectedFile,
    analysis,
    proposal,
    proposalMeta,
    onAnalyze,
    onPropose,
    busy
  } = props;

  const [instructions, setInstructions] = useState(
    'Refactor for clarity and safety, preserve behavior.'
  );

  const disabled = !selectedFile || busy;

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-slate-400">
          AI Console
        </div>
        <div className="text-[10px] text-slate-500">
          {selectedFile || 'No file selected'}
        </div>
      </div>

      <textarea
        className="w-full h-20 text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1 font-mono text-slate-100 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-400"
        value={instructions}
        onChange={function onChange(e) {
          setInstructions(e.target.value);
        }}
        disabled={busy}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={disabled}
          className="px-3 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
        >
          Analyze File
        </button>
        <button
          type="button"
          onClick={function clickPropose() {
            if (!disabled) {
              onPropose(instructions);
            }
          }}
          disabled={disabled}
          className="px-3 py-1 text-xs rounded bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50"
        >
          Generate Proposal
        </button>
      </div>

      {analysis && (
        <div className="mt-2 p-2 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-200 max-h-40 overflow-auto">
          <div className="font-semibold text-emerald-300 mb-1">
            ✓ Analysis Complete{typeof analysis?.quality_score === 'number' ? ` — Quality ${analysis.quality_score}/100` : ''}
          </div>
          {analysis?.summary ? (
            <div className="space-y-1">
              <p>{analysis.summary}</p>
              {Array.isArray(analysis.issues) && analysis.issues.length > 0 && (
                <ul className="list-disc pl-4">
                  {analysis.issues.map((iss, i) => (
                    <li key={i}>
                      <span className="text-amber-300">[{iss.severity || 'issue'}]</span> {iss.description}{iss.line ? ` (line ${iss.line})` : ''}
                    </li>
                  ))}
                </ul>
              )}
              {Array.isArray(analysis.suggestions) && analysis.suggestions.length > 0 && (
                <ul className="list-disc pl-4 text-cyan-200">
                  {analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              )}
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-mono">
              {typeof analysis === 'string' ? analysis : JSON.stringify(analysis, null, 2)}
            </pre>
          )}
        </div>
      )}

      {proposal && (
        <div className="mt-2 p-2 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-200 max-h-32 overflow-auto">
          <div className="font-semibold text-emerald-300 mb-1">
            Proposal Ready{proposalMeta?.risk ? ` — Risk: ${proposalMeta.risk}` : ''}
          </div>
          <p>{proposalMeta?.explanation || 'Review the diff and approve or reject below.'}</p>
        </div>
      )}
    </div>
  );
}