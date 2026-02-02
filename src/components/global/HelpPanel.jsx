import React, { useState } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function HelpPanel({ title, sections }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-[9998] w-14 h-14 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] transition-all flex items-center justify-center border-2 border-cyan-400/30"
        aria-label="Open help"
      >
        <HelpCircle className="w-7 h-7 text-white" />
      </button>

      {/* Help Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 right-0 bottom-0 w-full md:w-[480px] bg-slate-950 border-l-2 border-cyan-500/30 z-[9999] overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-cyan-500/20 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-bold text-white">{title}</h2>
                  <p className="text-sm text-cyan-400">Quick Reference Guide</p>
                </div>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Section Tabs */}
              <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3 flex gap-2 overflow-x-auto">
                {sections.map((section, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSection(idx)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                      activeSection === idx
                        ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {sections[activeSection]?.content.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                      {item.icon && <item.icon className="w-4 h-4 text-cyan-400" />}
                      {item.heading}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{item.text}</p>
                    {item.errorCode && (
                      <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/30">
                        <p className="text-xs text-red-400 font-mono">{item.errorCode}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}