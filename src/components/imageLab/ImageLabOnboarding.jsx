import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, Image, Sliders, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ONBOARDING_STEPS = [
  {
    title: "Welcome to GlyphLock Image Lab",
    description: "Military-grade AI image generation with cryptographic verification. This tool is designed for power users who need precision control.",
    highlight: null,
    icon: Sparkles
  },
  {
    title: "Prompt Engineering",
    description: "Describe your image in detail. Click 'Expand Prompt' to let AI enhance your prompt with technical specifications for better results.",
    highlight: "prompt-section",
    icon: Sparkles
  },
  {
    title: "Reference Images (Optional)",
    description: "Upload 1-4 reference images to guide style, composition, or identity. Adjust blend weights to control influence. Enable Identity Lock for face consistency.",
    highlight: "reference-section",
    icon: Image
  },
  {
    title: "Advanced Controls",
    description: "Fine-tune generation with aspect ratio, model strength, guidance scale, seed control, quality mode, and negative prompts. These parameters give you professional-level control.",
    highlight: "controls-section",
    icon: Sliders
  },
  {
    title: "Generation Modes",
    description: "Generate: New image from scratch. Restyle: Modify existing with different artistic direction. Reinterpret: Reimagine concept with same seed.",
    highlight: "generate-section",
    icon: Zap
  }
];

export default function ImageLabOnboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('glyphlock_imagelab_onboarding_seen');
    if (!hasSeenOnboarding) {
      setIsVisible(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('glyphlock_imagelab_onboarding_seen', 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  useEffect(() => {
    if (!isVisible) return;
    
    const step = ONBOARDING_STEPS[currentStep];
    if (step.highlight) {
      const element = document.getElementById(step.highlight);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('onboarding-highlight');
      }
    }

    return () => {
      ONBOARDING_STEPS.forEach(s => {
        if (s.highlight) {
          const el = document.getElementById(s.highlight);
          if (el) el.classList.remove('onboarding-highlight');
        }
      });
    };
  }, [currentStep, isVisible]);

  if (!isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={handleSkip}
        />

        {/* Onboarding Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-slate-900/95 backdrop-blur-xl border-2 border-cyan-500/30 rounded-2xl p-8 max-w-lg w-full shadow-[0_0_60px_rgba(6,182,212,0.3)]"
        >
          {/* Close Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>

          {/* Icon */}
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center mb-6">
            <Icon className="w-8 h-8 text-cyan-400" />
          </div>

          {/* Content */}
          <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>
          <p className="text-slate-300 leading-relaxed mb-6">{step.description}</p>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {ONBOARDING_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all ${
                  idx <= currentStep
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <span className="text-sm text-slate-500">
              {currentStep + 1} / {ONBOARDING_STEPS.length}
            </span>

            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
            >
              {currentStep === ONBOARDING_STEPS.length - 1 ? (
                'Get Started'
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* Skip Link */}
          <button
            onClick={handleSkip}
            className="block mx-auto mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Skip tutorial
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}