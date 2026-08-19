import React, { useEffect, useRef, useState } from "react";
import { Delete, Loader2 } from "lucide-react";

const DEFAULT_CLEAR_MS = 15_000;

function randomInt(max) {
  if (max <= 1) return 0;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function shuffleDigits() {
  const next = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

/**
 * Shoulder-surf-resistant numeric keypad.
 *
 * - Randomizes every mount and whenever shuffleKey changes.
 * - Holds the masked PIN only in the parent component's transient React state.
 * - Clears when focus leaves the keypad or after inactivity.
 * - Provides no text input, autofill target, reveal control, or persistence.
 */
export default function SecureNumericKeypad({
  value,
  onChange,
  onSubmit,
  busy = false,
  disabled = false,
  error = "",
  minLength = 4,
  maxLength = 6,
  submitLabel = "GO",
  shuffleKey = 0,
  clearAfterMs = DEFAULT_CLEAR_MS,
  onExpired,
}) {
  const rootRef = useRef(null);
  const [digits, setDigits] = useState(() => shuffleDigits());
  const locked = busy || disabled;

  useEffect(() => {
    setDigits(shuffleDigits());
  }, [shuffleKey]);

  useEffect(() => {
    if (!value || locked) return undefined;
    const timer = window.setTimeout(() => {
      onChange("");
      onExpired?.();
    }, clearAfterMs);
    return () => window.clearTimeout(timer);
  }, [clearAfterMs, locked, onChange, onExpired, value]);

  const append = (digit) => {
    if (locked || value.length >= maxLength) return;
    onChange(`${value}${digit}`);
  };

  const erase = () => {
    if (locked) return;
    onChange(value.slice(0, -1));
  };

  const submit = () => {
    if (locked || value.length < minLength) return;
    onSubmit?.();
  };

  const handleBlur = (event) => {
    if (rootRef.current?.contains(event.relatedTarget)) return;
    onChange("");
  };

  const handleKeyDown = (event) => {
    if (locked) return;
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      append(event.key);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      erase();
    } else if (event.key === "Enter") {
      event.preventDefault();
      submit();
    } else if (event.key === "Escape") {
      onChange("");
    }
  };

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoComplete="off"
      data-lpignore="true"
      data-1p-ignore="true"
      aria-label="Randomized secure numeric keypad"
    >
      <div className="mb-5 flex min-h-[24px] justify-center gap-3" aria-label={`${value.length} PIN digits entered`}>
        {Array.from({ length: maxLength }, (_, index) => (
          <span
            key={index}
            className={`h-4 w-4 rounded-full border-2 ${
              index < value.length ? "border-cyan-400 bg-cyan-400" : "border-slate-600"
            } ${index >= minLength && value.length < minLength ? "opacity-40" : ""}`}
          />
        ))}
      </div>

      {error && <p className="mb-3 text-center text-sm text-red-400" role="alert">{error}</p>}

      <div className="grid grid-cols-3 gap-3">
        {digits.slice(0, 9).map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => append(digit)}
            disabled={locked}
            className="h-16 rounded-xl border border-slate-700 bg-slate-800 text-2xl font-bold text-white transition active:bg-slate-700 disabled:opacity-40"
            aria-label={`Digit ${digit}`}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={erase}
          disabled={locked || value.length === 0}
          className="flex h-16 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition active:bg-slate-700 disabled:opacity-40"
          aria-label="Delete last PIN digit"
        >
          <Delete className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => append(digits[9])}
          disabled={locked}
          className="h-16 rounded-xl border border-slate-700 bg-slate-800 text-2xl font-bold text-white transition active:bg-slate-700 disabled:opacity-40"
          aria-label={`Digit ${digits[9]}`}
        >
          {digits[9]}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={locked || value.length < minLength}
          className="flex h-16 items-center justify-center rounded-xl bg-cyan-600 font-bold text-white transition active:bg-cyan-500 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : submitLabel}
        </button>
      </div>

      <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-500">
        Numbers move for every PIN session and after each failed attempt. Entry clears when you leave this pad or pause for {Math.round(clearAfterMs / 1000)} seconds.
      </p>
    </div>
  );
}
