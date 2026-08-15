import React from "react";
import { motion } from "framer-motion";
import { Sliders, Lock, Unlock } from "lucide-react";

export default function ControlsPanel({ controls, setControls }) {
  const handleSliderChange = (key, value) => {
    setControls(prev => ({ ...prev, [key]: value }));
  };

  const toggleSeedLock = () => {
    setControls(prev => ({ ...prev, seedLocked: !prev.seedLocked }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card border-[#00E4FF]/30 p-6 rounded-2xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <Sliders className="w-5 h-5 text-[#00E4FF]" />
        <h3 className="text-xl font-bold text-white">Advanced Controls</h3>
      </div>

      <div className="space-y-6">
        {/* Aspect Ratio */}
        <div>
          <label className="text-sm text-white/70 mb-2 block">Aspect Ratio</label>
          <div className="grid grid-cols-5 gap-2">
            {['1:1', '16:9', '4:5', '3:2', '9:16'].map((ratio) => (
              <button
                key={ratio}
                onClick={() => handleSliderChange('aspectRatio', ratio)}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  controls.aspectRatio === ratio
                    ? 'bg-gradient-to-r from-[#8C4BFF] to-[#00E4FF] text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Model Strength */}
        <div>
          <label className="text-sm text-white/70 mb-2 block flex justify-between">
            <span>Model Strength</span>
            <span className="text-[#00E4FF]">{controls.modelStrength}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={controls.modelStrength}
            onChange={(e) => handleSliderChange('modelStrength', parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-uv"
          />
        </div>

        {/* Sharpness */}
        <div>
          <label className="text-sm text-white/70 mb-2 block flex justify-between">
            <span>Sharpness</span>
            <span className="text-[#00E4FF]">{controls.sharpness}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={controls.sharpness}
            onChange={(e) => handleSliderChange('sharpness', parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-uv"
          />
        </div>

        {/* Creativity */}
        <div>
          <label className="text-sm text-white/70 mb-2 block flex justify-between">
            <span>Creativity</span>
            <span className="text-[#00E4FF]">{controls.creativity}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={controls.creativity}
            onChange={(e) => handleSliderChange('creativity', parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-uv"
          />
        </div>

        {/* Guidance Scale */}
        <div>
          <label className="text-sm text-white/70 mb-2 block flex justify-between">
            <span>Guidance Scale</span>
            <span className="text-[#00E4FF]">{controls.guidanceScale}</span>
          </label>
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={controls.guidanceScale}
            onChange={(e) => handleSliderChange('guidanceScale', parseFloat(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-uv"
          />
        </div>

        {/* Seed Control */}
        <div>
          <label className="text-sm text-white/70 mb-2 block">Seed</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={controls.seed}
              onChange={(e) => handleSliderChange('seed', parseInt(e.target.value) || 0)}
              disabled={!controls.seedLocked}
              className="flex-1 bg-black/50 border border-[#8C4BFF]/30 rounded-lg px-3 py-2 text-white text-sm disabled:opacity-50"
            />
            <button
              onClick={toggleSeedLock}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-[#8C4BFF]/30 rounded-lg transition-colors"
            >
              {controls.seedLocked ? (
                <Lock className="w-5 h-5 text-[#00E4FF]" />
              ) : (
                <Unlock className="w-5 h-5 text-white/40" />
              )}
            </button>
          </div>
        </div>

        {/* Quality Mode */}
        <div>
          <label className="text-sm text-white/70 mb-2 block">Quality Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {['Fast', 'Standard', 'Ultra'].map((mode) => (
              <button
                key={mode}
                onClick={() => handleSliderChange('qualityMode', mode)}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  controls.qualityMode === mode
                    ? 'bg-gradient-to-r from-[#8C4BFF] to-[#00E4FF] text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Negative Prompt */}
        <div>
          <label className="text-sm text-white/70 mb-2 block">Negative Prompt</label>
          <textarea
            value={controls.negativePrompt}
            onChange={(e) => handleSliderChange('negativePrompt', e.target.value)}
            placeholder="What to avoid..."
            rows={3}
            className="w-full bg-black/50 border border-[#8C4BFF]/30 rounded-lg p-3 text-white text-sm placeholder:text-white/30 resize-none"
          />
        </div>
      </div>

      <style>{`
        .slider-uv::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #8C4BFF, #00E4FF);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(140, 75, 255, 0.5);
        }
        .slider-uv::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #8C4BFF, #00E4FF);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(140, 75, 255, 0.5);
          border: none;
        }
      `}</style>
    </motion.div>
  );
}