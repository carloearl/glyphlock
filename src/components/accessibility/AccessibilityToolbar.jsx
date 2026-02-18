import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, EyeOff, Type, ZoomIn, ZoomOut, Contrast, 
  MousePointer2, Pause, Play, Volume2, VolumeX,
  RotateCcw, Accessibility, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const STORAGE_KEY = "gl_accessibility_prefs";

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}

function savePrefs(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export default function AccessibilityToolbar({ open, onClose }) {
  const [prefs, setPrefs] = useState(() => loadPrefs());

  const update = (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePrefs(next);
  };

  const reset = () => {
    setPrefs({});
    savePrefs({});
    document.documentElement.style.fontSize = '';
    document.body.classList.remove('a11y-high-contrast', 'a11y-large-cursor', 'a11y-reduce-motion', 'a11y-dyslexia-font', 'a11y-underline-links', 'a11y-invert');
  };

  // Apply prefs
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Font size
    if (prefs.fontSize) root.style.fontSize = `${prefs.fontSize}px`;
    else root.style.fontSize = '';

    // High contrast
    if (prefs.highContrast) body.classList.add('a11y-high-contrast');
    else body.classList.remove('a11y-high-contrast');

    // Large cursor
    if (prefs.largeCursor) body.classList.add('a11y-large-cursor');
    else body.classList.remove('a11y-large-cursor');

    // Reduce motion
    if (prefs.reduceMotion) body.classList.add('a11y-reduce-motion');
    else body.classList.remove('a11y-reduce-motion');

    // Dyslexia font
    if (prefs.dyslexiaFont) body.classList.add('a11y-dyslexia-font');
    else body.classList.remove('a11y-dyslexia-font');

    // Underline links
    if (prefs.underlineLinks) body.classList.add('a11y-underline-links');
    else body.classList.remove('a11y-underline-links');

    // Color invert
    if (prefs.invertColors) body.classList.add('a11y-invert');
    else body.classList.remove('a11y-invert');
  }, [prefs]);

  if (!open) return null;

  const Toggle = ({ label, icon: Icon, active, onToggle, color = "cyan" }) => (
    <button
      onClick={onToggle}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all text-left ${
        active
          ? `border-${color}-400/60 bg-${color}-500/15 text-white`
          : 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]'
      }`}
      aria-pressed={active}
      role="switch"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? `text-${color}-400` : 'text-white/40'}`} />
      <span className="text-sm font-semibold flex-1">{label}</span>
      <span className={`text-xs font-bold uppercase ${active ? 'text-green-400' : 'text-white/30'}`}>
        {active ? 'ON' : 'OFF'}
      </span>
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-950/98 backdrop-blur-2xl border-l-2 border-cyan-500/30 z-[10002] overflow-y-auto shadow-[0_0_80px_rgba(6,182,212,0.2)]"
        role="dialog"
        aria-label="Accessibility Settings"
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Accessibility className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Accessibility Tools</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close accessibility panel">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Font Size */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Text Size</label>
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-white/40" />
              <Slider
                value={[prefs.fontSize || 16]}
                min={12}
                max={28}
                step={1}
                onValueChange={([v]) => update('fontSize', v)}
                className="flex-1"
                aria-label="Font size"
              />
              <ZoomIn className="w-4 h-4 text-white/40" />
              <span className="text-xs text-white/60 w-8 text-right">{prefs.fontSize || 16}px</span>
            </div>
          </div>

          {/* Vision */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" /> Vision Support
            </label>
            <div className="space-y-2">
              <Toggle label="High Contrast Mode" icon={Contrast} active={prefs.highContrast} onToggle={() => update('highContrast', !prefs.highContrast)} />
              <Toggle label="Invert Colors" icon={EyeOff} active={prefs.invertColors} onToggle={() => update('invertColors', !prefs.invertColors)} />
              <Toggle label="Underline All Links" icon={Type} active={prefs.underlineLinks} onToggle={() => update('underlineLinks', !prefs.underlineLinks)} />
              <Toggle label="Large Cursor" icon={MousePointer2} active={prefs.largeCursor} onToggle={() => update('largeCursor', !prefs.largeCursor)} />
            </div>
          </div>

          {/* Motor / Cognitive */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
              <Pause className="w-3.5 h-3.5" /> Motor & Cognitive
            </label>
            <div className="space-y-2">
              <Toggle label="Reduce Motion / Animations" icon={Pause} active={prefs.reduceMotion} onToggle={() => update('reduceMotion', !prefs.reduceMotion)} />
              <Toggle label="Dyslexia-Friendly Font" icon={Type} active={prefs.dyslexiaFont} onToggle={() => update('dyslexiaFont', !prefs.dyslexiaFont)} />
            </div>
          </div>

          {/* Reset */}
          <Button onClick={reset} variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10">
            <RotateCcw className="w-4 h-4 mr-2" /> Reset All Settings
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}