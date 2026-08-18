import React from "react";

export default function PolicySection({ number, title, children }) {
  return (
    <section className="mb-10 scroll-mt-24" id={`section-${number}`}>
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
        {number ? `${number}. ` : ""}{title}
      </h2>
      <div className="space-y-3 text-white/80 leading-relaxed text-sm md:text-base">
        {children}
      </div>
    </section>
  );
}