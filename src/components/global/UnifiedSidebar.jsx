import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, MessageSquare, X, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlyphBotJr from '@/components/glyphlock/bot/ui/GlyphBotJr';

export default function UnifiedSidebar({ helpSections = [], helpTitle = "System Guide" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'bot' or 'help'
  const [activeSection, setActiveSection] = useState(0);
  const [activeItem, setActiveItem] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      {/* Sidebar Tab */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => {
          if (window.innerWidth >= 768) setIsOpen(true);
        }}
        className="fixed right-[-52px] hover:right-0 z-[999999] w-14 h-32 rounded-l-2xl bg-gradient-to-br from-purple-600/90 to-indigo-600/90 backdrop-blur-xl border border-r-0 border-purple-400/60 shadow-[0_0_30px_rgba(168,85,247,0.6),0_0_60px_rgba(168,85,247,0.3)] flex flex-col items-center justify-center gap-3 active:scale-95 transition-all duration-300"
        style={{ 
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'rgba(168, 85, 247, 0.4)',
          cursor: 'pointer',
          minWidth: '56px',
          minHeight: '128px',
          zIndex: 999999,
          animation: 'sidebarGlow 3s ease-in-out infinite',
        }}
      >
        <MessageSquare className="w-6 h-6 text-purple-100 drop-shadow-[0_0_8px_rgba(168,85,247,0.9)] pointer-events-none" />
        <style>{`
          @keyframes sidebarGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(168,85,247,0.2); }
            50% { box-shadow: 0 0 35px rgba(168,85,247,0.75), 0 0 65px rgba(168,85,247,0.35); }
          }
        `}</style>
      </button>

        {/* Slide-Out Menu */}
        <AnimatePresence>
          {isOpen && !activeModal && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onMouseLeave={() => {
                if (window.innerWidth >= 768) setIsOpen(false);
              }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-80 bg-slate-900/95 backdrop-blur-2xl border-l border-purple-500/30 shadow-[-12px_0_40px_rgba(168,85,247,0.35)] overflow-y-auto z-[999998]"
              style={{
                pointerEvents: 'auto',
                touchAction: 'pan-y'
              }}
            >
              <div className="sticky top-0 z-10 p-5 border-b border-purple-500/20 bg-gradient-to-r from-purple-600/15 to-indigo-600/15 backdrop-blur-xl flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-0.5">Quick Assist</h3>
                <p className="text-xs text-purple-300/80">AI help & system guides</p>
              </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-3 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
                  style={{ touchAction: 'manipulation', minWidth: '48px', minHeight: '48px', pointerEvents: 'auto' }}
                >
                  <X className="w-6 h-6 text-purple-300 pointer-events-none" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* GlyphBot Jr Option */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveModal('bot');
                    setIsOpen(false);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveModal('bot');
                    setIsOpen(false);
                  }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/15 to-indigo-500/15 border border-purple-400/35 hover:border-purple-400/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-[0.98] transition-all cursor-pointer"
                  style={{
                    minHeight: '120px',
                    pointerEvents: 'auto',
                    touchAction: 'manipulation',
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                      <MessageSquare className="w-6 h-6 text-purple-200" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">GlyphBot Jr</h4>
                      <p className="text-xs text-purple-300/80">AI Assistant</p>
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveModal('help');
                    setIsOpen(false);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveModal('help');
                    setIsOpen(false);
                  }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/15 to-indigo-500/15 border border-purple-400/35 hover:border-purple-400/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-[0.98] transition-all cursor-pointer"
                  style={{
                    minHeight: '120px',
                    pointerEvents: 'auto',
                    touchAction: 'manipulation',
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                      <HelpCircle className="w-6 h-6 text-purple-200" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Help Guide</h4>
                      <p className="text-xs text-purple-300/80">Documentation</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Step-by-step tutorials, troubleshooting guides, and feature walkthroughs.
                  </p>
                </motion.div>
              </div>

              <div className="sticky bottom-0 p-4 border-t border-purple-500/15 bg-slate-950/90 backdrop-blur-xl">
                <p className="text-xs text-center text-purple-400/70">Tap an option to get started</p>
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
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setActiveModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 30 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-5xl bg-slate-900/95 border border-purple-500/30 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.35),0_0_140px_rgba(168,85,247,0.15)] backdrop-blur-2xl flex flex-col"
              style={{ height: '85vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                    <HelpCircle className="w-5 h-5 text-purple-200" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{helpTitle}</h2>
                    <p className="text-xs text-purple-400/70">Knowledge Base</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 rounded-xl hover:bg-white/10 transition-all"
                  style={{ touchAction: 'manipulation', minWidth: '44px', minHeight: '44px', pointerEvents: 'auto' }}
                >
                  <X className="w-5 h-5 text-slate-400 hover:text-red-400 pointer-events-none" />
                </button>
              </div>

              {/* Fixed Tab Bar + Glass Dropdown */}
              <div className="flex items-center gap-2 px-6 py-3 border-b border-purple-500/15 bg-slate-900/60 shrink-0 flex-wrap">
                {/* Section Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-400/40 hover:border-purple-400/70 text-white text-sm font-semibold transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.35)] min-w-[180px]"
                  >
                    <span className="flex-1 text-left truncate">{helpSections[activeSection]?.title || 'Select Section'}</span>
                    <ChevronDown className={`w-4 h-4 text-purple-300 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute top-full left-0 mt-2 w-64 z-50 rounded-2xl overflow-hidden"
                        style={{
                          background: 'rgba(15, 10, 30, 0.97)',
                          border: '1px solid rgba(168, 85, 247, 0.35)',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(168,85,247,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
                          backdropFilter: 'blur(24px)',
                        }}
                      >
                        <div className="p-2">
                          {helpSections.map((section, idx) => (
                            <button
                              key={idx}
                              onClick={() => { setActiveSection(idx); setActiveItem(0); setDropdownOpen(false); }}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                                activeSection === idx
                                  ? 'bg-gradient-to-r from-purple-600/40 to-indigo-600/40 text-white border border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              {activeSection === idx && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                              {activeSection !== idx && <span className="w-3.5 h-3.5 shrink-0" />}
                              {section.title}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Topic Glow Dots - no labels */}
                <div className="flex items-center gap-2 flex-wrap">
                  {helpSections[activeSection]?.content?.map((item, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => setActiveItem(cIdx)}
                      title={item.heading}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        activeItem === cIdx
                          ? 'bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.9),0_0_20px_rgba(168,85,247,0.5)] scale-125'
                          : 'bg-white/20 hover:bg-purple-400/50 hover:shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Content Area - no scroll, full height */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {helpSections[activeSection]?.content?.[activeItem] && (
                    <motion.div
                      key={`${activeSection}-${activeItem}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="h-full p-8 overflow-y-auto"
                    >
                      {(() => {
                        const item = helpSections[activeSection].content[activeItem];
                        return (
                          <div className="max-w-3xl mx-auto space-y-6">
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-1">{item.heading}</h3>
                              <div className="h-px bg-gradient-to-r from-purple-500/50 to-transparent mt-3" />
                            </div>
                            <p className="text-base text-slate-300 leading-relaxed whitespace-pre-line">{item.text}</p>
                            {item.tip && (
                              <div className="flex gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-400/25">
                                <span className="text-lg shrink-0">💡</span>
                                <p className="text-sm text-purple-200 leading-relaxed">{item.tip}</p>
                              </div>
                            )}
                            {item.action && (
                              <div className="flex gap-3 p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/25">
                                <span className="text-lg shrink-0">▶</span>
                                <p className="text-sm text-cyan-200 leading-relaxed">{item.action}</p>
                              </div>
                            )}
                            {/* Nav arrows */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                              <button
                                onClick={() => setActiveItem(Math.max(0, activeItem - 1))}
                                disabled={activeItem === 0}
                                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 disabled:opacity-30 transition-all"
                              >
                                ← Prev
                              </button>
                              <span className="text-xs text-slate-500">{activeItem + 1} / {helpSections[activeSection].content.length}</span>
                              <button
                                onClick={() => setActiveItem(Math.min(helpSections[activeSection].content.length - 1, activeItem + 1))}
                                disabled={activeItem === helpSections[activeSection].content.length - 1}
                                className="px-5 py-2.5 rounded-xl bg-purple-600/20 border border-purple-400/30 text-sm text-purple-200 hover:bg-purple-600/35 disabled:opacity-30 transition-all"
                              >
                                Next →
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}