import React, { useState } from 'react';
import { HelpCircle, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HelpPanel({ title = "Help Guide", sections = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  if (!sections || sections.length === 0) return null;

  return (
    <>
      {/* Floating Help Button - Fixed position */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-[9998] w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_40px_rgba(6,182,212,0.8)] flex items-center justify-center transition-all hover:scale-110 border-2 border-cyan-400/30"
        aria-label="Open help"
      >
        <HelpCircle className="w-6 h-6 text-white" />
      </button>

      {/* Help Panel Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <Card 
            className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-900/98 to-slate-800/98 border-2 border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.4)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Section Tabs */}
            <div className="flex border-b border-slate-700 overflow-x-auto">
              {sections.map((section, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSection(idx)}
                  className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                    activeSection === idx
                      ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>

            {/* Content */}
            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {sections[activeSection]?.content?.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <ChevronRight className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-white mb-2">{item.heading}</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                    {idx < sections[activeSection].content.length - 1 && (
                      <div className="border-b border-slate-800/50 mt-4" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>

            {/* Footer */}
            <div className="p-4 border-t border-cyan-500/20 bg-slate-950/60 flex items-center justify-between">
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                {activeSection + 1} of {sections.length}
              </Badge>
              <Button
                onClick={() => setIsOpen(false)}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                Got it
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}