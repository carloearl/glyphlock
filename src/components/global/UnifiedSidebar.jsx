import React, { useState } from 'react';
import { HelpCircle, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlyphBotJr from '@/components/glyphlock/bot/ui/GlyphBotJr';

export default function UnifiedSidebar({ helpSections = [], helpTitle = "System Guide" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'bot' or 'help'

  return (
    <>
      {/* MOBILE-FIRST: Unified Sidebar Tab */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-0 z-[999999] w-20 h-48 md:w-16 md:h-40 rounded-l-3xl bg-gradient-to-br from-purple-600 to-indigo-600 backdrop-blur-xl border-2 border-r-0 border-purple-400 shadow-[0_0_60px_rgba(168,85,247,0.9)] flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform"
        style={{ 
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'rgba(168, 85, 247, 0.5)',
          cursor: 'pointer',
          minWidth: '80px',
          minHeight: '192px'
        }}
      >
        <MessageSquare className="w-10 h-10 md:w-8 md:h-8 text-purple-100 drop-shadow-[0_0_15px_rgba(168,85,247,1)]" />
        <span className="text-base md:text-sm text-white font-black -rotate-90 whitespace-nowrap tracking-wider">ASSIST</span>
      </button>

        {/* Slide-Out Menu */}
        <AnimatePresence>
          {isOpen && !activeModal && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-slate-900/98 backdrop-blur-2xl border-l-2 border-purple-500/50 shadow-[-20px_0_60px_rgba(168,85,247,0.6)] overflow-y-auto z-[999998]"
              style={{
                pointerEvents: 'auto',
                touchAction: 'pan-y'
              }}
            >
              <div className="sticky top-0 z-10 p-6 border-b border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Quick Assist</h3>
                  <p className="text-sm text-purple-300">AI help & system guides</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-3 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
                  style={{ touchAction: 'manipulation', minWidth: '48px', minHeight: '48px' }}
                >
                  <X className="w-6 h-6 text-purple-300" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* GlyphBot Jr Option */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => { setActiveModal('bot'); setIsOpen(false); }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-2 border-purple-400/40 active:border-purple-400/80 active:scale-98 transition-all cursor-pointer"
                  style={{
                    minHeight: '120px',
                    pointerEvents: 'auto',
                    touchAction: 'manipulation'
                  }}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/40 to-indigo-500/40 border-2 border-purple-400/60 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.6)]">
                      <MessageSquare className="w-8 h-8 text-purple-200" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">GlyphBot Jr</h4>
                      <p className="text-sm text-purple-300">AI Assistant</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Ask questions, get instant answers, troubleshoot issues with AI-powered support.
                  </p>
                </motion.div>

                {/* Help Guide Option */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => { setActiveModal('help'); setIsOpen(false); }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400/40 active:border-cyan-400/80 active:scale-98 transition-all cursor-pointer"
                  style={{
                    minHeight: '120px',
                    pointerEvents: 'auto',
                    touchAction: 'manipulation'
                  }}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/40 to-blue-500/40 border-2 border-cyan-400/60 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                      <HelpCircle className="w-8 h-8 text-cyan-200" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">Help Guide</h4>
                      <p className="text-sm text-cyan-300">Documentation</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Step-by-step tutorials, troubleshooting guides, and feature walkthroughs.
                  </p>
                </motion.div>
              </div>

              <div className="sticky bottom-0 p-6 border-t border-purple-500/20 bg-slate-950/95 backdrop-blur-xl">
                <p className="text-sm text-center text-purple-400 font-semibold">Tap an option to get started</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* GlyphBot Jr Modal - Force Expanded State */}
      {activeModal === 'bot' && (
        <div className="fixed inset-0 z-[999999] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center" style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}>
          <div className="w-full h-[90vh] md:w-[480px] md:h-[700px] md:rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.8)]">
            <GlyphBotJr onClose={() => setActiveModal(null)} forceExpanded={true} />
          </div>
        </div>
      )}

      {/* Help Panel Modal */}
      <AnimatePresence>
        {activeModal === 'help' && helpSections.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4" 
            style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setActiveModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border-2 border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.5)]"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border-2 border-cyan-400/60 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{helpTitle}</h2>
                  <p className="text-xs text-cyan-400">Knowledge Base</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5 text-slate-400 hover:text-red-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {helpSections.map((section, idx) => (
                <div key={idx} className="mb-6">
                  <h3 className="text-lg font-bold text-cyan-300 mb-3">{section.title}</h3>
                  <div className="space-y-3">
                    {section.content?.map((item, cIdx) => (
                      <div key={cIdx} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                        <h4 className="text-sm font-semibold text-white mb-2">{item.heading}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}