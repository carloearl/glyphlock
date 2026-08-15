import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Sparkles, Image, Sliders, Zap, Lock, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const HELP_SECTIONS = {
  prompts: {
    title: "Prompt Engineering",
    icon: Sparkles,
    content: [
      {
        q: "How do prompts work?",
        a: "Prompts are natural language descriptions that guide the AI. Be specific about subject, style, lighting, camera angle, and technical details. Example: 'neon biomechanical wolf, 8K ultra detailed, cosmic background, rim lighting, volumetric fog'"
      },
      {
        q: "What is Prompt Expansion?",
        a: "Clicking 'Expand Prompt' uses AI to enhance your prompt with structured technical specifications (subject, style, lighting, camera, mood, technical details). This ensures better consistency and professional results."
      },
      {
        q: "How do I get better results?",
        a: "Use detailed descriptions, specify art style, mention quality keywords (8K, detailed, professional), describe lighting and composition, and use style presets as starting points."
      }
    ]
  },
  references: {
    title: "Reference Images",
    icon: Image,
    content: [
      {
        q: "What are Reference Images?",
        a: "Reference images guide the AI's output. Upload 1-4 images to influence style, color palette, composition, or identity. The AI extracts features (color, lighting, texture, composition) and blends them into your generation."
      },
      {
        q: "How do Blend Weights work?",
        a: "Weights control how much influence each reference has. Total must equal 100%. Example: 60% for main style, 40% for color palette. Adjust sliders to balance influences."
      },
      {
        q: "What is Identity Lock?",
        a: "When enabled, Identity Lock extracts facial features from reference images and enforces similarity threshold (87% minimum). Ensures generated faces match the reference. Requires clear face in reference image."
      }
    ]
  },
  controls: {
    title: "Advanced Controls",
    icon: Sliders,
    content: [
      {
        q: "Aspect Ratio",
        a: "Image dimensions. 1:1 (square), 16:9 (landscape), 4:5 (portrait), 3:2 (classic photo), 9:16 (mobile vertical). Choose based on intended use case."
      },
      {
        q: "Model Strength / Delta",
        a: "Controls how much the AI deviates from references. Lower = closer to reference, Higher = more creative interpretation. Refinement (0.3), Balanced (0.5), Restyle (0.7), Reinterpret (0.9)."
      },
      {
        q: "Guidance Scale",
        a: "How strictly the AI follows your prompt. 7-12 recommended. Lower = more creative freedom, Higher = stricter adherence to prompt. Too high can cause artifacts."
      },
      {
        q: "Seed Control",
        a: "Random seed for reproducibility. Same seed + same prompt = similar results. Click shuffle for new random seed. Lock seed to maintain consistency across regenerations."
      },
      {
        q: "Quality Mode",
        a: "Fast (quick iterations), Standard (balanced quality/speed), Ultra (maximum quality, slower). Use Fast for experimentation, Ultra for final outputs."
      },
      {
        q: "Negative Prompt",
        a: "Describe what you DON'T want. Example: 'blurry, low quality, watermark, text, deformed hands'. Helps avoid common AI artifacts."
      }
    ]
  },
  modes: {
    title: "Generation Modes",
    icon: Zap,
    content: [
      {
        q: "Generate",
        a: "Create new image from scratch using expanded prompt and reference influences. Full creative generation with all parameters applied."
      },
      {
        q: "Restyle",
        a: "Take existing image and apply different artistic style while preserving core composition. Uses delta_strength = 0.7. Good for style transfer."
      },
      {
        q: "Reinterpret",
        a: "Reimagine the concept with high deviation (delta_strength = 0.9). Same seed but more creative freedom. Creates variations while maintaining prompt theme."
      },
      {
        q: "Validation Scores",
        a: "Generated images are scored for face_anatomy, hand_anatomy, realism, and identity_similarity (if Identity Lock enabled). Scores below 70% trigger automatic regeneration."
      }
    ]
  }
};

export default function ImageLabHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('prompts');

  return (
    <>
      {/* Help Trigger Button - NEUROMORPHISM */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-xl bg-slate-800/80 backdrop-blur-md border-2 border-indigo-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.3)] hover:shadow-[0_0_35px_rgba(99,102,241,0.5)] transition-all z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Image Lab Help"
      >
        <HelpCircle className="w-6 h-6 text-indigo-400" />
      </motion.button>

      {/* Help Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-slate-900/95 backdrop-blur-xl border-2 border-indigo-500/30 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-[0_0_60px_rgba(99,102,241,0.3)]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600/15 to-purple-600/15 border-b border-indigo-500/20 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Image Lab Guide</h2>
                    <p className="text-sm text-indigo-300">Advanced AI Generation Manual</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-black/30 p-2 mb-6">
                    {Object.entries(HELP_SECTIONS).map(([key, section]) => {
                      const Icon = section.icon;
                      return (
                        <TabsTrigger
                          key={key}
                          value={key}
                          className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:border data-[state=active]:border-indigo-500/40"
                        >
                          <Icon className="w-4 h-4" />
                          <span className="hidden sm:inline text-xs">{section.title}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {Object.entries(HELP_SECTIONS).map(([key, section]) => (
                    <TabsContent key={key} value={key} className="space-y-4">
                      {section.content.map((item, idx) => (
                        <Card key={idx} className="bg-slate-800/60 border-2 border-slate-700/60 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm text-indigo-300 font-semibold">{item.q}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-slate-300 leading-relaxed">{item.a}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Footer */}
              <div className="bg-slate-950/80 border-t border-slate-800 p-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => {
                    localStorage.removeItem('glyphlock_imagelab_onboarding_seen');
                    setIsOpen(false);
                  }}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Reset Tutorial
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                >
                  Close Guide
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .onboarding-highlight {
          position: relative;
          box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.3);
          border-radius: 12px;
          animation: highlight-pulse 2s ease-in-out infinite;
        }

        @keyframes highlight-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.3);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(6, 182, 212, 0.6), 0 0 60px rgba(6, 182, 212, 0.5);
          }
        }
      `}</style>
    </>
  );
}