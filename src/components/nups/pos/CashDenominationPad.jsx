import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

/**
 * Cash denomination counter — like a real register.
 * Tap bills to add them up, or use the numpad for exact amount.
 */
const BILLS = [
  { value: 100, label: "$100", color: "text-green-300" },
  { value: 50, label: "$50", color: "text-green-400" },
  { value: 20, label: "$20", color: "text-emerald-400" },
  { value: 10, label: "$10", color: "text-teal-400" },
  { value: 5, label: "$5", color: "text-cyan-400" },
  { value: 1, label: "$1", color: "text-blue-400" },
];

const COINS = [
  { value: 0.25, label: "25¢" },
  { value: 0.10, label: "10¢" },
  { value: 0.05, label: "5¢" },
  { value: 0.01, label: "1¢" },
];

export default function CashDenominationPad({ total, onConfirm }) {
  const [tendered, setTendered] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("0");

  const change = tendered - total;

  const addBill = (value) => {
    setTendered((prev) => Math.round((prev + value) * 100) / 100);
  };

  const handleNumKey = (key) => {
    if (key === "C") {
      setCustomValue("0");
    } else if (key === "⌫") {
      setCustomValue((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
    } else if (key === ".") {
      if (!customValue.includes(".")) setCustomValue((prev) => prev + ".");
    } else {
      setCustomValue((prev) => (prev === "0" ? key : prev + key));
    }
  };

  const applyCustom = () => {
    const val = parseFloat(customValue) || 0;
    setTendered(val);
    setCustomMode(false);
  };

  const handleExact = () => {
    setTendered(Math.ceil(total * 100) / 100);
  };

  return (
    <div className="space-y-3">
      {/* Tendered Display */}
      <div className="bg-black/70 border border-green-500/30 rounded-xl p-4 text-center">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Cash Tendered</div>
        <div className="text-5xl font-mono font-black text-green-400 my-1">
          ${tendered.toFixed(2)}
        </div>
        {tendered >= total ? (
          <div className="mt-1">
            <span className="text-xs text-gray-400">Change Due: </span>
            <span className="text-xl font-bold text-yellow-400">${change.toFixed(2)}</span>
          </div>
        ) : tendered > 0 ? (
          <div className="text-xs text-red-400 mt-1">
            Still owe ${(total - tendered).toFixed(2)}
          </div>
        ) : null}
      </div>

      {!customMode ? (
        <>
          {/* Bill Denomination Buttons */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Tap Bills</div>
            <div className="grid grid-cols-3 gap-2">
              {BILLS.map((b) => (
                <Button
                  key={b.value}
                  variant="outline"
                  onClick={() => addBill(b.value)}
                  className="h-16 text-2xl font-black border-green-500/20 bg-green-900/10 hover:bg-green-900/30 active:scale-90 transition-all"
                >
                  <span className={b.color}>{b.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Coins */}
          <div className="grid grid-cols-4 gap-2">
            {COINS.map((c) => (
              <Button
                key={c.value}
                variant="outline"
                onClick={() => addBill(c.value)}
                className="h-10 text-sm font-bold border-gray-700 text-gray-300 bg-gray-900/40 hover:bg-gray-800/60 active:scale-90"
              >
                {c.label}
              </Button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={() => setTendered(0)}
              className="h-10 border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-bold"
            >
              Clear
            </Button>
            <Button
              variant="outline"
              onClick={handleExact}
              className="h-10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-sm font-bold"
            >
              Exact
            </Button>
            <Button
              variant="outline"
              onClick={() => setCustomMode(true)}
              className="h-10 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-sm font-bold"
            >
              Keypad
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Numpad for custom amount */}
          <div className="bg-black/50 border border-white/10 rounded-xl p-3">
            <div className="text-right text-3xl font-mono font-bold text-white mb-3 pr-2">
              ${customValue}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["7","8","9","4","5","6","1","2","3","C","0","."].map((k) => (
                <Button
                  key={k}
                  variant="outline"
                  onClick={() => handleNumKey(k)}
                  className={`h-14 text-xl font-bold active:scale-90 ${
                    k === "C" ? "bg-red-500/20 border-red-500/30 text-red-400" : "border-gray-700 text-white bg-gray-900/50"
                  }`}
                >
                  {k}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button variant="outline" onClick={() => handleNumKey("⌫")} className="h-12 border-amber-500/30 text-amber-400">
                <Delete className="w-5 h-5" />
              </Button>
              <Button onClick={applyCustom} className="h-12 bg-green-600 hover:bg-green-700 text-white font-bold">
                Set Amount
              </Button>
            </div>
          </div>
          <Button variant="outline" onClick={() => setCustomMode(false)} className="w-full h-10 border-gray-700 text-gray-400">
            ← Back to Bills
          </Button>
        </>
      )}

      {/* Confirm */}
      <Button
        onClick={() => onConfirm(tendered)}
        disabled={tendered < total}
        className="w-full h-16 text-xl font-black bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {tendered >= total
          ? `Complete — Change $${change.toFixed(2)}`
          : `Need $${(total - tendered).toFixed(2)} more`
        }
      </Button>
    </div>
  );
}