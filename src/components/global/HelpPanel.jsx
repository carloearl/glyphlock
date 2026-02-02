import React, { useState, useEffect } from 'react';
import { HelpCircle, X, ChevronRight, ChevronLeft, Sparkles, Target, CheckCircle2, Circle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function HelpPanel({ title = "System Guide", sections = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [walkthroughMode, setWalkthroughMode] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setWalkthroughMode(false);
      setCurrentStep(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !walkthroughMode) return;
    
    const section = sections[activeSection];
    if (section?.content?.[currentStep]?.targetId) {
      const element = document.getElementById(section.content[currentStep].targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('glyph-walkthrough-highlight');
      }
    }

    return () => {
      sections.forEach(s => {
        s?.content?.forEach(item => {
          if (item.targetId) {
            const el = document.getElementById(item.targetId);
            if (el) el.classList.remove('glyph-walkthrough-highlight');
          }
        });
      });
    };
  }, [currentStep, activeSection, isOpen, walkthroughMode, sections]);

  const handleNext = () => {
    const section = sections[activeSection];
    if (currentStep < section.content.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (activeSection < sections.length - 1) {
      setActiveSection(activeSection + 1);
      setCurrentStep(0);
    } else {
      setWalkthroughMode(false);
      setCurrentStep(0);
      setActiveSection(0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (activeSection > 0) {
      setActiveSection(activeSection - 1);
      setCurrentStep(sections[activeSection - 1].content.length - 1);
    }
  };

  const totalSteps = sections.reduce((sum, s) => sum + s.content.length, 0);
  const currentGlobalStep = sections.slice(0, activeSection).reduce((sum, s) => sum + s.content.length, 0) + currentStep + 1;

  if (!sections || sections.length === 0) return null;

  return (
    <>
      {/* Floating Help Button - CYBER NEON */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 z-[9998] w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 backdrop-blur-xl border-2 border-cyan-400/50 shadow-[0_0_40px_rgba(6,182,212,0.6),inset_0_0_20px_rgba(168,85,247,0.2)] flex items-center justify-center transition-all group hover:shadow-[0_0_60px_rgba(6,182,212,0.9)]"
        aria-label="Open help guide"
      >
        <HelpCircle className="w-7 h-7 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,1)] group-hover:drop-shadow-[0_0_12px_rgba(6,182,212,1)]" />
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-950 shadow-[0_0_12px_rgba(6,182,212,1)] animate-pulse" />
      </motion.button>

      {/* Help Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-purple-600/30 blur-2xl -z-10" />
              
              <div className="bg-gradient-to-br from-slate-900/98 via-slate-950/98 to-slate-900/98 border-2 border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.5),inset_0_0_60px_rgba(168,85,247,0.15)]">
                
                {/* Header */}
                <div className="relative overflow-hidden border-b-2 border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-blue-500/10">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg2LDE4MiwyMTIsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                  
                  <div className="relative flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-600/30 border-2 border-cyan-400/60 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.6),inset_0_0_20px_rgba(168,85,247,0.3)]"
                      >
                        <HelpCircle className="w-7 h-7 text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,1)]" />
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300">
                          {title}
                        </h2>
                        <p className="text-xs text-cyan-400/80 uppercase tracking-[0.3em] font-semibold">
                          {walkthroughMode ? 'Interactive Walkthrough' : 'Knowledge Base'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {!walkthroughMode && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => { e.stopPropagation(); setWalkthroughMode(true); }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/80 to-blue-600/80 border border-purple-400/50 text-white text-sm font-bold shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(168,85,247,0.8)] transition-all flex items-center gap-2"
                        >
                          <Target className="w-4 h-4" />
                          Start Tour
                        </motion.button>
                      )}
                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-3 rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-red-500/50"
                      >
                        <X className="w-5 h-5 text-slate-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  {walkthroughMode && (
                    <div className="px-6 pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-cyan-300 font-mono">
                          STEP {currentGlobalStep} / {totalSteps}
                        </span>
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentGlobalStep / totalSteps) * 100}%` }}
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                          />
                        </div>
                        <span className="text-xs text-purple-300 font-mono">
                          {Math.round((currentGlobalStep / totalSteps) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="relative">
                  {walkthroughMode ? (
                    <div className="p-8 min-h-[400px] flex flex-col">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${activeSection}-${currentStep}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="flex-1"
                        >
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-400/60 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                              <span className="text-lg font-black text-cyan-300">
                                {currentGlobalStep}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs text-purple-400 uppercase tracking-[0.2em] font-semibold">
                                {sections[activeSection].title}
                              </p>
                              <h3 className="text-xl font-black text-white">
                                {sections[activeSection].content[currentStep].heading}
                              </h3>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="p-6 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                              <p className="text-base text-slate-200 leading-relaxed">
                                {sections[activeSection].content[currentStep].text}
                              </p>
                            </div>

                            {sections[activeSection].content[currentStep].tip && (
                              <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-400/30">
                                <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-1">Pro Tip</p>
                                  <p className="text-sm text-purple-200">{sections[activeSection].content[currentStep].tip}</p>
                                </div>
                              </div>
                            )}

                            {sections[activeSection].content[currentStep].action && (
                              <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/30">
                                <Target className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1">Action Required</p>
                                  <p className="text-sm text-cyan-200">{sections[activeSection].content[currentStep].action}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      <div className="flex items-center justify-between pt-6 mt-6 border-t-2 border-slate-800/50">
                        <Button
                          onClick={handlePrev}
                          disabled={currentStep === 0 && activeSection === 0}
                          variant="outline"
                          className="border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 disabled:opacity-30"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Previous
                        </Button>

                        <div className="flex items-center gap-2">
                          {sections.map((_, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-1">
                              {sections[sIdx].content.map((_, cIdx) => {
                                const isActive = sIdx === activeSection && cIdx === currentStep;
                                const isPast = sIdx < activeSection || (sIdx === activeSection && cIdx < currentStep);
                                return (
                                  <div
                                    key={cIdx}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                      isActive 
                                        ? 'bg-cyan-400 w-8 shadow-[0_0_8px_rgba(6,182,212,1)]' 
                                        : isPast
                                          ? 'bg-purple-500/70'
                                          : 'bg-slate-700'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>

                        <Button
                          onClick={handleNext}
                          className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                        >
                          {currentGlobalStep === totalSteps ? 'Finish' : 'Next'}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row min-h-[500px] max-h-[65vh]">
                      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r-2 border-slate-800/50 bg-slate-950/60 p-4 space-y-2 overflow-y-auto">
                        {sections.map((section, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveSection(idx)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
                              activeSection === idx
                                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-2 border-cyan-400/60 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-2 border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {activeSection === idx ? (
                                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                              {section.title}
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="flex-1 p-6 overflow-y-auto">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                          >
                            {sections[activeSection]?.content?.map((item, idx) => (
                              <div key={idx} className="space-y-3">
                                <div className="flex items-start gap-3 p-5 rounded-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-2 border-purple-500/20 hover:border-cyan-400/40 transition-all shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]">
                                  <Zap className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                                  <div className="flex-1 space-y-2">
                                    <h4 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">
                                      {item.heading}
                                    </h4>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                      {item.text}
                                    </p>
                                    {item.code && (
                                      <pre className="mt-3 p-3 rounded-lg bg-black/60 border border-cyan-500/30 overflow-x-auto">
                                        <code className="text-xs font-mono text-green-400">
                                          {item.code}
                                        </code>
                                      </pre>
                                    )}
                                  </div>
                                </div>
                                {idx < sections[activeSection].content.length - 1 && (
                                  <div className="border-b border-slate-800/30" />
                                )}
                              </div>
                            ))}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                <div className="p-5 border-t-2 border-cyan-500/20 bg-gradient-to-r from-slate-950/95 to-slate-900/95 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                      {walkthroughMode ? `${currentGlobalStep} of ${totalSteps}` : `${sections.length} Sections`}
                    </div>
                    {!walkthroughMode && (
                      <p className="text-xs text-slate-400">
                        Press <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-400">?</kbd> anytime for help
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {walkthroughMode && (
                      <Button
                        onClick={() => setWalkthroughMode(false)}
                        variant="outline"
                        className="border-slate-700 hover:border-slate-600"
                      >
                        Exit Tour
                      </Button>
                    )}
                    <Button
                      onClick={() => setIsOpen(false)}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] font-bold"
                    >
                      Got it
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .glyph-walkthrough-highlight {
          position: relative;
          z-index: 9999 !important;
          box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.6), 0 0 60px rgba(6, 182, 212, 0.8) !important;
          border-radius: 12px !important;
          animation: glyph-pulse 2s ease-in-out infinite !important;
        }

        @keyframes glyph-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.6), 0 0 60px rgba(6, 182, 212, 0.8); }
          50% { box-shadow: 0 0 0 6px rgba(168, 85, 247, 0.7), 0 0 80px rgba(168, 85, 247, 0.9); }
        }
      `}</style>
    </>
  );
}