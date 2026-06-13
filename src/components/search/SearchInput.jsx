import React, { useEffect, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";

export default function SearchInput({ value, onChange, isLoading, placeholder = "Search across all records — name, date, serial, ID…" }) {
  const ref = useRef(null);
  const [local, setLocal] = useState(value || "");

  // Debounce 250ms
  useEffect(() => {
    const id = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 250);
    return () => clearTimeout(id);
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autofocus
  useEffect(() => {
    if (ref.current) ref.current.focus();
  }, []);

  // Keyboard: Escape clears
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && document.activeElement === ref.current) {
        setLocal("");
        onChange("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onChange]);

  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
      <input
        ref={ref}
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-900/70 border-2 border-violet-500/30 focus:border-violet-400 rounded-xl pl-12 pr-12 py-4 text-white text-base placeholder-gray-500 outline-none transition-colors"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {isLoading && <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />}
        {local && (
          <button
            type="button"
            onClick={() => {
              setLocal("");
              onChange("");
              ref.current?.focus();
            }}
            className="text-gray-500 hover:text-white p-1"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <kbd className="hidden sm:inline-block text-[10px] text-gray-500 bg-black/40 border border-gray-700 rounded px-1.5 py-0.5">
          ESC
        </kbd>
      </div>
    </div>
  );
}