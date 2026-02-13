import React, { useState } from 'react';
import { HelpCircle, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI } from '@/components/glyphlock/bot';

const { GlyphBotJr } = UI;

export default function UnifiedSidebar({ helpSections = [], helpTitle = "System Guide" }) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'bot' or 'help'

  return (
    <>
      {/* Unified Sidebar Tab - Right Edge */}
      <div
        className="fixed right-0 z-[999999]"
        style={{ 
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'auto !important',
          touchAction: 'manipulation !important',
          WebkitTapHighlightColor: 'rgba(168, 85, 247, 0.3)',
          cursor: 'pointer'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
      >
        {/* Collapsed Tab */}
        <div 
          className="absolute right-0 w-16 h-40 rounded-l-2xl bg-gradient-to-br from-purple-600/90 to-indigo-600/90 backdrop-blur-xl border-2 border-r-0 border-purple-400/80 transition-all duration-300 shadow-[0_0_60px_rgba(168,85,247,0.9)] flex flex-col items-center justify-center gap-3 cursor-pointer hover:w-20 active:scale-95"
          style={{
            pointerEvents: 'auto !important',
            touchAction: 'manipulation !important',
            WebkitTapHighlightColor: 'rgba(168, 85, 247, 0.4)',
            minWidth: '64px',
            minHeight: '160px'
          }}
        >
          <MessageSquare className="w-8 h-8 text-purple-100 drop-shadow-[0_0_15px_rgba(168,85,247,1)]" />
          <span className="text-sm text-white font-bold -rotate-90 whitespace-nowrap tracking-wider">ASSIST</span>
        </div>

        {/* Hover Preview - Shows Both Options */}
        <AnimatePresence>
          {isHovered && !activeModal && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute right-16 top-0 w-80 rounded-l-2xl bg-slate-900/98 backdrop-blur-2xl border-2 border-r-0 border-purple-500/50 shadow-[0_0_60px_rgba(168,85,247,0.6)] overflow-hidden"
              style={{
                pointerEvents: 'auto !important',
                touchAction: 'manipulation !important'
              }}
            >
              <div className="p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-indigo-600/20">
                <h3 className="text-base font-bold text-white mb-1">Quick Assist</h3>
                <p className="text-xs text-purple-300">AI help & system guides</p>
              </div>

              <div className="p-4 space-y-3">
                {/* GlyphBot Jr Option */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => setActiveModal('bot')}
                  className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-2 border-purple-400/40 hover:border-purple-400/80 hover:from-purple-500/30 hover:to-indigo-500/30 transition-all cursor-pointer group active:scale-95"
                  style={{
                    minHeight: '80px',
                    pointerEvents: 'auto !important',
                    touchAction: 'manipulation !important'
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/40 to-indigo-500/40 border-2 border-purple-400/60 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.6)]">
                      <MessageSquare className="w-6 h-6 text-purple-200" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">GlyphBot Jr</h4>
                      <p className="text-xs text-purple-300">AI Assistant</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Ask questions, get instant answers, troubleshoot issues with AI-powered support.
                  </p>
                </motion.div>

                {/* Help Guide Option */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setActiveModal('help')}
                  className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400/40 hover:border-cyan-400/80 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all cursor-pointer group active:scale-95"
                  style={{
                    minHeight: '80px',
                    pointerEvents: 'auto !important',
                    touchAction: 'manipulation !important'
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/40 to-blue-500/40 border-2 border-cyan-400/60 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                      <HelpCircle className="w-6 h-6 text-cyan-200" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Help Guide</h4>
                      <p className="text-xs text-cyan-300">Documentation</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Step-by-step tutorials, troubleshooting guides, and feature walkthroughs.
                  </p>
                </motion.div>
              </div>

              <div className="p-3 border-t border-purple-500/20 bg-slate-950/80">
                <p className="text-xs text-center text-purple-400">Click an option to get started</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* GlyphBot Jr Modal */}
      {activeModal === 'bot' && (
        <div className="fixed inset-0 z-[999999]" style={{ pointerEvents: 'auto !important', touchAction: 'manipulation !important' }}>
          <GlyphBotJr onClose={() => setActiveModal(null)} />
        </div>
      )}

      {/* Help Panel Modal */}
      {activeModal === 'help' && helpSections.length > 0 && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4" style={{ pointerEvents: 'auto !important', touchAction: 'manipulation !important' }}>
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setActiveModal(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
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
        </div>
      )}
    </>
  );
}