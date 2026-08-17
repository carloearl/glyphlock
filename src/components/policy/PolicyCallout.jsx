import React from "react";

export default function PolicyCallout({ label, children }) {
  return (
    <div className="my-5 border-l-4 border-amber-400/70 bg-amber-400/10 rounded-r-lg px-4 py-3">
      <p className="text-sm md:text-base text-white/90">
        <span className="font-bold text-amber-300">{label}: </span>
        {children}
      </p>
    </div>
  );
}