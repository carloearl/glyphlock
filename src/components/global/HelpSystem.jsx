import React, { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HelpContext = createContext();

export function HelpProvider({ children, steps, storageKey }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenWalkthrough, setHasSeenWalkthrough] = useState(() => {
    return localStorage.getItem(storageKey) === 'true';
  });

  const showWalkthrough = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  const completeWalkthrough = () => {
    localStorage.setItem(storageKey, 'true');
    setHasSeenWalkthrough(true);
    setIsOpen(false);
  };

  return (
    <HelpContext.Provider value={{ isOpen, setIsOpen, currentStep, setCurrentStep, steps, showWalkthrough, completeWalkthrough, hasSeenWalkthrough }}>
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  return useContext(HelpContext);
}

export function HelpTrigger() {
  const { setIsOpen } = useHelp();

  return (
    <motion.button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 border-2 border-cyan-400/50 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.5)] hover:shadow-[0_0_60px_rgba(6,182,212,0.8)] transition-all z-50"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <HelpCircle className="w-7 h-7 text-white" />
    </motion.button>
  );
}

export function HelpWalkthrough() {
  const { isOpen, setIsOpen, currentStep, setCurrentStep, steps, completeWalkthrough } = useHelp();

  if (!steps || steps.length === 0) return null;

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeWalkthrough();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-slate-900/98 backdrop-blur-xl border-2 border-cyan-500/40 rounded-2xl p-8 max-w-lg w-full shadow-[0_0_80px_rgba(6,182,212,0.5)]"
          >
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5 text-slate-400" />
            </button>

            {step.icon && <step.icon className="w-12 h-12 text-cyan-400 mb-4" />}
            <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>
            <p className="text-slate-300 leading-relaxed mb-6">{step.description}</p>

            <div className="flex gap-2 mb-6">
              {steps.map((_, idx) => (
                <div key={idx} className={`h-1 flex-1 rounded-full ${idx <= currentStep ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-slate-700'}`} />
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 0}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <span className="text-slate-500 text-sm">{currentStep + 1} / {steps.length}</span>
              <Button onClick={handleNext} className="bg-gradient-to-r from-cyan-600 to-purple-600">
                {currentStep === steps.length - 1 ? 'Start' : 'Next'} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}