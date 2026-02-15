/**
 * SearchBar - Live filter with slash-to-focus
 */
import React, { useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SearchBar({ value, onChange }) {
  const ref = useRef(null);

  // Expose ref for keyboard shortcut focusing
  React.useEffect(() => {
    const el = ref.current;
    if (el) el.dataset.mixerSearch = "true";
  }, []);

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      <Input
        ref={ref}
        data-mixer-search="true"
        type="text"
        placeholder="Search songs… ( / )"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8 h-9 bg-slate-800/60 border-slate-700 text-white text-sm placeholder:text-slate-500"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}