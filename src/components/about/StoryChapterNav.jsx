import React, { useEffect, useState } from "react";

export default function StoryChapterNav({ chapters }) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      ticking = false;

      // Track which chapter is currently in view
      const viewportCenter = window.innerHeight * 0.35;
      let currentIdx = 0;
      let smallest = Infinity;

      chapters.forEach((chapter, idx) => {
        const el = document.getElementById("chapter-" + chapter.number);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - viewportCenter);
        if (dist < smallest) {
          smallest = dist;
          currentIdx = idx;
        }
      });
      setActive(currentIdx);

      // Track scroll progress through the section
      const section = document.getElementById("story-section");
      if (section) {
        const rect = section.getBoundingClientRect();
        const scrolled = Math.max(0, -rect.top + window.innerHeight * 0.35);
        const max = Math.max(1, rect.height - window.innerHeight * 0.5);
        setProgress(Math.min(1, Math.max(0, scrolled / max)));
      }
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [chapters]);

  const scrollToChapter = (e, number) => {
    e.preventDefault();
    const target = document.getElementById("chapter-" + number);
    if (!target) return;
    const headerOffset = 100;
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <nav
      className="hidden h-full flex-col lg:sticky lg:top-24 lg:flex"
      aria-label="Story chapter progress"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
          Chapters
        </p>
        <p className="font-mono text-[10px] font-black text-slate-600">
          {String(active + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}
        </p>
      </div>

      <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] transition-[width] duration-150"
          style={{ width: (progress * 100).toFixed(1) + "%" }}
        />
      </div>

      <ol className="mt-4 space-y-0.5">
        {chapters.map((chapter, index) => {
          const Icon = chapter.icon;
          const isActive = active === index;
          const isPast = active > index;
          return (
            <li key={chapter.number}>
              <a
                href={"#chapter-" + chapter.number}
                onClick={(e) => scrollToChapter(e, chapter.number)}
                className={
                  "group flex items-center gap-3 rounded-xl border px-3 py-3 transition-all duration-200 " +
                  (isActive
                    ? "border-[#00E4FF]/40 bg-[#00E4FF]/[0.08]"
                    : isPast
                      ? "border-white/5 bg-transparent opacity-40 hover:opacity-80"
                      : "border-transparent hover:border-white/10 hover:bg-white/[0.03]")
                }
              >
                <span
                  className={
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors " +
                    (isActive
                      ? "border-[#00E4FF]/50 bg-[#00E4FF]/15 text-[#00E4FF]"
                      : isPast
                        ? "border-[#8C4BFF]/25 bg-[#8C4BFF]/[0.06] text-[#8C4BFF]/60"
                        : "border-white/10 bg-black/30 text-slate-500 group-hover:text-slate-300")
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
                      (isActive
                        ? "text-white"
                        : isPast
                          ? "text-slate-500"
                          : "text-slate-400 group-hover:text-slate-200")
                    }
                  >
                    {chapter.label}
                  </span>
                </span>
                {isActive ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00E4FF]" />
                ) : null}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}