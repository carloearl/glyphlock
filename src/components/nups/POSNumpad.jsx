import React from "react";
import { Button } from "@/components/ui/button";
import { Delete, CornerDownLeft } from "lucide-react";

export default function POSNumpad({ value, onChange, onSubmit }) {
  const handleKey = (key) => {
    if (key === "C") {
      onChange("0");
    } else if (key === "⌫") {
      const newVal = value.length > 1 ? value.slice(0, -1) : "0";
      onChange(newVal);
    } else if (key === ".") {
      if (!value.includes(".")) onChange(value + ".");
    } else {
      // Prevent leading zeros
      const newVal = value === "0" ? key : value + key;
      onChange(newVal);
    }
  };

  const keys = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    ["C", "0", "."],
  ];

  return (
    <div className="space-y-2">
      {/* Display */}
      <div className="bg-black/60 border border-cyan-500/30 rounded-xl p-4 text-right">
        <span className="text-xs text-gray-500 block">Amount</span>
        <span className="text-4xl font-mono font-bold text-green-400 tracking-wider">
          ${value}
        </span>
      </div>

      {/* Numpad grid */}
      <div className="grid grid-cols-3 gap-2">
        {keys.flat().map((key) => (
          <Button
            key={key}
            type="button"
            onClick={() => handleKey(key)}
            className={`h-16 text-2xl font-bold rounded-xl transition-all active:scale-95 ${
              key === "C"
                ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
                : "bg-gray-800/80 border-gray-700/50 text-white hover:bg-gray-700/80"
            }`}
            variant="outline"
          >
            {key}
          </Button>
        ))}
      </div>

      {/* Backspace & Quick amounts */}
      <div className="grid grid-cols-4 gap-2">
        <Button
          type="button"
          onClick={() => handleKey("⌫")}
          className="h-12 bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30 rounded-xl"
          variant="outline"
        >
          <Delete className="w-5 h-5" />
        </Button>
        {["20", "50", "100"].map((amt) => (
          <Button
            key={amt}
            type="button"
            onClick={() => onChange(amt)}
            className="h-12 bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 rounded-xl font-bold"
            variant="outline"
          >
            ${amt}
          </Button>
        ))}
      </div>

      {onSubmit && (
        <Button
          type="button"
          onClick={onSubmit}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl"
        >
          <CornerDownLeft className="w-5 h-5 mr-2" />
          Confirm Payment
        </Button>
      )}
    </div>
  );
}