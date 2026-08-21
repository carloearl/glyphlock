import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function StoryChapterNav({ chapters }) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const elements = chapters
      .map((c) => document.getElementById("chapter-" + c.number))
      .filter(Boolean);

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

    elements.forEach((el) => observer.observe(el));

    // Scroll progress through the story section
    const section = document.getElementById("story-section");
    const onScroll = () => {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const scrolled = Math.max(0, -rect.top);
      const max = Math.max(1, rect.height - window.innerHeight * 0.5);
      setProgress(Math.min(1, scrolled / max));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [chapters]);

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
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
            Chapters
          </p>
          <p className="font-mono text-[10px] font-black text-slate-600">
            {String(active + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF]"
            style={{ width: (progress * 100).toFixed(1) + "%" }}
          />
        </div>

        <ol className="space-y-1">
          {chapters.map((chapter, index) => {
            const Icon = chapter.icon;
            const isActive = active === index;
            const isPast = active > index;
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
                    "group flex items-center gap-3 rounded-xl border px-3 py-3 transition-all " +
                    (isActive
                      ? "border-[#00E4FF]/40 bg-[#00E4FF]/10"
                      : isPast
                        ? "border-white/5 bg-transparent opacity-50 hover:opacity-100"
                        : "border-transparent hover:border-white/10 hover:bg-white/[0.04]")
                  }
                >
                  <span
                    className={
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors " +
                      (isActive
                        ? "border-[#00E4FF]/50 bg-[#00E4FF]/15 text-[#00E4FF]"
                        : isPast
                          ? "border-[#8C4BFF]/30 bg-[#8C4BFF]/10 text-[#8C4BFF]/70"
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
                        (isActive ? "text-white" : isPast ? "text-slate-500" : "text-slate-400 group-hover:text-slate-200")
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