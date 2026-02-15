import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bot, X, Play, Pause, SkipForward, Globe, Loader2, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp, Zap, ExternalLink, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

function StepCard({ step, index, isLast }) {
  const [expanded, setExpanded] = useState(isLast);

  return (
    <div className={`relative pl-8 pb-4 ${!isLast ? 'border-l-2 border-cyan-500/30 ml-3' : 'border-l-2 border-cyan-400 ml-3'}`}>
      {/* Step dot */}
      <div className={`absolute left-[-7px] top-0 w-3.5 h-3.5 rounded-full border-2 ${isLast ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-slate-700 border-cyan-500/50'}`} />
      
      <div 
        className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 cursor-pointer hover:border-cyan-500/30 transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">#{step.step_number}</span>
            <span className="text-xs text-white truncate">{step.summary}</span>
          </div>
          {expanded ? <ChevronUp className="w-3 h-3 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 text-slate-500 flex-shrink-0" />}
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Globe className="w-3 h-3" />
                  <a href={step.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline truncate">{step.url}</a>
                </div>
                {step.findings?.length > 0 && (
                  <div className="space-y-1">
                    {step.findings.map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[10px] text-slate-300">
                        <span className="text-cyan-400 mt-0.5">•</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProgressBar({ percent }) {
  return (
    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
}

export default function AgentMode({ onClose }) {
  const [task, setTask] = useState('');
  const [url, setUrl] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [steps, setSteps] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, running, paused, completed, error
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [autoRun, setAutoRun] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const scrollRef = useRef(null);

  // Check usage on mount
  useEffect(() => {
    checkUsage();
  }, []);

  // Auto-scroll steps
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  // Auto-run next step
  useEffect(() => {
    if (autoRun && status === 'running' && analysis?.next_action?.type !== 'complete' && !loading) {
      const timer = setTimeout(() => executeNextStep(), 1500);
      return () => clearTimeout(timer);
    }
  }, [autoRun, status, analysis, loading]);

  const checkUsage = async () => {
    try {
      const resp = await base44.functions.invoke('browserAgent', { action: 'checkUsage' });
      setRemaining(resp.data.remaining);
    } catch (e) {
      console.error('Usage check failed:', e);
    }
  };

  const startSession = async () => {
    if (!task.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setStatus('running');
    setSteps([]);
    setExtractedData(null);

    try {
      const resp = await base44.functions.invoke('browserAgent', {
        action: 'start',
        task: task.trim(),
        url: url.trim() || undefined
      });

      const data = resp.data;
      if (data.error) {
        setErrorMsg(data.error);
        setStatus('error');
        return;
      }

      setSessionId(data.session_id);
      setSteps([data.step]);
      setAnalysis(data.analysis);
      setProgress(data.analysis?.progress_percent || 10);
      setStatusMessage(data.analysis?.status_message || 'Session started');
      setExtractedData(data.analysis?.extracted_data || null);
      setRemaining(data.remaining);

      if (data.analysis?.next_action?.type === 'complete') {
        setStatus('completed');
      }
    } catch (e) {
      console.error('Start failed:', e);
      setErrorMsg(e.response?.data?.error || 'Failed to start agent session');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const executeNextStep = async () => {
    if (!sessionId || loading) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const resp = await base44.functions.invoke('browserAgent', {
        action: 'step',
        session_id: sessionId,
        override_url: analysis?.next_action?.url || undefined
      });

      const data = resp.data;
      if (data.error) {
        setErrorMsg(data.error);
        if (data.error === 'Session already completed' || data.error === 'Max steps reached') {
          setStatus('completed');
        }
        return;
      }

      setSteps(prev => [...prev, data.step]);
      setAnalysis(data.analysis);
      setProgress(data.analysis?.progress_percent || Math.min(90, progress + 10));
      setStatusMessage(data.analysis?.status_message || `Step ${data.step_count} complete`);
      
      if (data.analysis?.extracted_data) {
        setExtractedData(prev => ({ ...(prev || {}), ...data.analysis.extracted_data }));
      }

      if (data.status === 'completed' || data.analysis?.next_action?.type === 'complete') {
        setStatus('completed');
        setProgress(100);
        setAutoRun(false);
      }
    } catch (e) {
      console.error('Step failed:', e);
      setErrorMsg(e.response?.data?.error || 'Step execution failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoRun = () => {
    if (autoRun) {
      setAutoRun(false);
      setStatus('paused');
    } else {
      setAutoRun(true);
      setStatus('running');
    }
  };

  const resetSession = () => {
    setSessionId(null);
    setSteps([]);
    setAnalysis(null);
    setStatus('idle');
    setProgress(0);
    setStatusMessage('');
    setExtractedData(null);
    setErrorMsg('');
    setAutoRun(false);
    checkUsage();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[60000] flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_60px_rgba(6,182,212,0.15)] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">GlyphBot Agent</h2>
              <p className="text-[10px] text-slate-400">
                Web intelligence • {remaining !== null ? `${remaining}/3 sessions today` : 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status !== 'idle' && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                status === 'running' ? 'bg-cyan-500/20 text-cyan-300' :
                status === 'paused' ? 'bg-amber-500/20 text-amber-300' :
                status === 'completed' ? 'bg-green-500/20 text-green-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                {status === 'running' && <><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Running</>}
                {status === 'paused' && <><Pause className="w-3 h-3" /> Paused</>}
                {status === 'completed' && <><CheckCircle2 className="w-3 h-3" /> Complete</>}
                {status === 'error' && <><AlertCircle className="w-3 h-3" /> Error</>}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {status !== 'idle' && (
          <div className="px-4 pt-2">
            <ProgressBar percent={progress} />
            {statusMessage && <p className="text-[10px] text-slate-400 mt-1">{statusMessage}</p>}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {/* Task Input (idle state) */}
          {status === 'idle' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">What should the agent research?</label>
                <textarea
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="Example: Find the current weather in Phoenix, AZ and summarize the 3-day forecast"
                  rows={3}
                  className="w-full bg-slate-800/80 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 text-sm placeholder:text-slate-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Starting URL <span className="text-slate-500">(optional — leave blank for auto search)</span>
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-slate-800/80 text-white rounded-xl p-3 border border-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 text-sm placeholder:text-slate-500"
                />
              </div>

              {remaining === 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-300">Daily limit reached. Resets at midnight.</p>
                </div>
              )}

              <Button
                onClick={startSession}
                disabled={!task.trim() || loading || remaining === 0}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] disabled:opacity-40 disabled:shadow-none"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting Agent...</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" /> Launch Agent</>
                )}
              </Button>
            </div>
          )}

          {/* Steps Timeline */}
          {steps.length > 0 && (
            <div className="space-y-0">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Execution Timeline</div>
              {steps.map((step, i) => (
                <StepCard key={i} step={step} index={i} isLast={i === steps.length - 1} />
              ))}
            </div>
          )}

          {/* Next Action Preview */}
          {analysis?.next_action && status !== 'completed' && status !== 'idle' && (
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3">
              <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mb-2">Next Action</div>
              <p className="text-xs text-slate-300">{analysis.next_action.description}</p>
              {analysis.next_action.url && (
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400">
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate">{analysis.next_action.url}</span>
                </div>
              )}
            </div>
          )}

          {/* Extracted Data */}
          {extractedData && Object.keys(extractedData).length > 0 && (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3">
              <div className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-2">Extracted Data</div>
              <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                {JSON.stringify(extractedData, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{errorMsg}</p>
            </div>
          )}

          {/* Completed */}
          {status === 'completed' && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-xs text-green-300">Task completed. All findings are shown above.</p>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        {status !== 'idle' && (
          <div className="p-4 border-t border-slate-800 flex items-center gap-2 flex-shrink-0">
            {status !== 'completed' && status !== 'error' && (
              <>
                <Button
                  onClick={executeNextStep}
                  disabled={loading || autoRun}
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white gap-1.5"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SkipForward className="w-3.5 h-3.5" />}
                  Next Step
                </Button>
                <Button
                  onClick={toggleAutoRun}
                  size="sm"
                  variant="outline"
                  className={`gap-1.5 border-slate-700 ${autoRun ? 'text-amber-300 border-amber-500/50 bg-amber-500/10' : 'text-slate-300'}`}
                >
                  {autoRun ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Auto-Run</>}
                </Button>
              </>
            )}
            <Button
              onClick={resetSession}
              size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-white gap-1.5 ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" /> New Session
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}