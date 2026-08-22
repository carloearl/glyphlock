import React from "react";

export default function ThrivalSignature() {
  return (
    <section className="w-full max-w-4xl">
      <div className="rounded-3xl px-8 sm:px-12 py-12 text-center border border-blue-400/30 bg-white/[0.03] backdrop-blur-md">
        <p className="text-lg text-blue-200/80 leading-relaxed max-w-2xl mx-auto">
          The work started as a way to survive a bad system. It continues because the
          record it produces makes the business around it better.
        </p>
        <p className="mt-6 text-2xl sm:text-3xl font-black">
          <span className="bg-gradient-to-r from-blue-200 via-cyan-200 to-indigo-200 bg-clip-text text-transparent">
            Thrival.
          </span>
        </p>
      </div>
    </section>
  );
}