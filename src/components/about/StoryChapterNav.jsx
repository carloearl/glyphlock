import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function StoryChapterNav({ chapters }) {
  const [active, setActive] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.chapterIndex);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );

    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [chapters.length]);

  return (
    <div className="lg:sticky lg:top-24">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[#00E4FF]">
        The origin
      </p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl font-space">
        The question changed. The principle did not.
      </h2>
      <p className="mt-5 text-base leading-relaxed text-slate-300 md:text-lg">
        GlyphLock did not begin as venue software. It began by asking how a
        digital object could retain identity and history. Real operations
        revealed that people, agreements, and transactions needed the same thing.
      </p>

      <div className="mt-8 rounded-2xl border border-[#00E4FF]/20 bg-[#00E4FF]/[0.045] p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E4FF]">
          The through line
        </p>
        <p className="mt-3 text-lg font-bold leading-relaxed text-white">
          Identify the subject. Apply permission. Record the action. Preserve
          the evidence.
        </p>
      </div>

      {/* Chapter progress navigator */}
      <nav className="mt-8 hidden lg:block" aria-label="Story chapter progress">
        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
          Chapters
        </p>
        <ol className="space-y-1">
          {chapters.map((chapter, index) => {
            const Icon = chapter.icon;
            const isActive = active === index;
            return (
              <li key={chapter.number}>
                <a
                  href={"#chapter-" + chapter.number}
                  onClick={(e) => {
                    e.preventDefault();
                    const target = document.getElementById("chapter-" + chapter.number);
                    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={
                    "group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all " +
                    (isActive
                      ? "border-[#00E4FF]/40 bg-[#00E4FF]/10"
                      : "border-transparent hover:border-white/10 hover:bg-white/[0.04]")
                  }
                >
                  <span
                    className={
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors " +
                      (isActive
                        ? "border-[#00E4FF]/50 bg-[#00E4FF]/15 text-[#00E4FF]"
                        : "border-white/10 bg-black/40 text-slate-500 group-hover:text-slate-300")
                    }
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[9px] font-black text-slate-600">
                      {chapter.number}
                    </span>
                    <span
                      className={
                        "block truncate text-xs font-bold transition-colors " +
                        (isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")
                      }
                    >
                      {chapter.label}
                    </span>
                  </span>
                  {isActive ? (
                    <motion.span
                      layoutId="chapterActiveDot"
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00E4FF]"
                    />
                  ) : null}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}