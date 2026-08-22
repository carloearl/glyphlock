import React, { useState } from "react";
import { Sparkles } from "lucide-react";

export default function CarloOriginStory() {
  const [clicks, setClicks] = useState(0);
  const [found, setFound] = useState(false);

  const handleClick = () => {
    const next = clicks + 1;
    if (next >= 3) {
      setFound(true);
      setClicks(0);
    } else {
      setClicks(next);
    }
  };

  return (
    <section
      id="origin"
      className="w-full max-w-5xl rounded-3xl px-7 sm:px-12 py-12 sm:py-14 mb-16"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.14) 0%, rgba(49, 46, 129, 0.1) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        backdropFilter: 'blur(16px)'
      }}
    >
      <p className="text-xs tracking-[0.3em] uppercase text-blue-300 font-bold text-center mb-4">
        The Origin Moment
      </p>
      <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-10">
        A Conversation About Camouflage
      </h2>

      <div className="space-y-6 text-lg text-blue-100 leading-relaxed max-w-3xl mx-auto">
        <p>
          Years of venue work, design, and music production had already made one thing
          obvious: the systems people relied on to record what actually happened were the
          weakest part of the operation.
        </p>

        <div
          onClick={handleClick}
          title={clicks > 0 ? `${3 - clicks} more...` : "Something's here..."}
          className="relative p-7 rounded-2xl bg-blue-500/10 border border-blue-400/40 cursor-pointer transition-all duration-300 hover:border-blue-300 hover:bg-blue-500/15"
        >
          {clicks > 0 && (
            <div className="absolute top-3 right-3 flex gap-1">
              {[...Array(clicks)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              ))}
            </div>
          )}
          <p>
            Then a conversation in Arizona shifted the trajectory.{" "}
            <span className="text-white font-semibold">Collin Vanderginst was talking about camouflage</span>
            {" "}— military patterns engineered to hide a person in plain sight.
          </p>
          <p className="mt-4">Most people would have stopped there.</p>
          <p className="mt-5 text-xl sm:text-2xl text-white font-bold text-center leading-snug">
            What if the pattern is not hiding you?<br />
            <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              What if the pattern itself carries the information?
            </span>
          </p>
        </div>

        <p>
          That question produced the first experiment: an ordinary image used as a carrier
          for data that survived being copied, shared, and re-encoded. The image was the
          proof-of-concept. The principle underneath it was{" "}
          <span className="text-white font-semibold">continuity</span> — a record that
          stays attached to the thing it describes.
        </p>

        <p>
          Continuity is what venue operations were missing. That is the line from a
          camouflage conversation to GlyphLock, and from GlyphLock to NUPS.
        </p>
      </div>

      {found && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
          <div
            className="relative max-w-xl w-full p-10 rounded-[2rem] text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.28) 0%, rgba(139, 92, 246, 0.28) 100%)',
              border: '2px solid rgba(59, 130, 246, 0.7)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <Sparkles className="w-10 h-10 text-cyan-300 mx-auto mb-4" />
            <h3 className="text-3xl font-black text-white mb-6">Pattern Recognition Unlocked</h3>
            <p className="text-xl text-blue-100 italic">"The pattern is the intelligence."</p>
            <p className="text-xs tracking-[0.3em] text-blue-300 font-semibold mt-4">CARLO, 2025</p>
            <button
              onClick={() => setFound(false)}
              className="mt-8 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </section>
  );
}