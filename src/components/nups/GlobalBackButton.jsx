import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getOperatorHome } from "@/lib/nups/roleHomes";

const KEY = "gl_nav_stack";

const readStack = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch { return []; }
};

/**
 * Universal back button — tracks the exact in-app navigation trail
 * (path + query) in session storage and returns the user to the precise
 * page they came from. Hidden when there is nowhere to go back to.
 */
export default function GlobalBackButton({ inline = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [canGoBack, setCanGoBack] = useState(false);
  const home = getOperatorHome();
  const onHomePage = home && location.pathname.toLowerCase() === home.path.toLowerCase();

  useEffect(() => {
    const path = location.pathname + location.search;
    let stack = readStack();
    if (stack[stack.length - 1] !== path) {
      // Returning to the previous entry = a back move; pop instead of push
      if (stack.length > 1 && stack[stack.length - 2] === path) stack.pop();
      else stack.push(path);
      if (stack.length > 50) stack = stack.slice(-50);
      sessionStorage.setItem(KEY, JSON.stringify(stack));
    }
    setCanGoBack(stack.length > 1);
  }, [location]);

  const goBack = () => {
    const stack = readStack();
    if (stack.length >= 2) {
      stack.pop();
      sessionStorage.setItem(KEY, JSON.stringify(stack));
      navigate(stack[stack.length - 1]);
    } else if (home && !onHomePage) {
      // No previous page — fall back to the operator's own dashboard
      navigate(home.path);
    }
  };

  // Nothing to go back to AND no role dashboard to fall back to (or already there)
  if (!canGoBack && (!home || onHomePage)) return null;

  // Inline variant — lives inside the kiosk top strip so it never overlays
  // page content (overlay audit 2026-07-17).
  const cls = inline
    ? "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold text-cyan-300/80 border border-cyan-500/20 hover:border-cyan-400/50 hover:text-white transition-colors print:hidden"
    : "fixed bottom-5 left-5 z-[9999] flex items-center gap-2 rounded-full bg-slate-900/90 border-2 border-purple-500/40 text-purple-200 text-sm font-bold px-5 py-3 min-h-[44px] shadow-lg shadow-purple-900/40 backdrop-blur hover:border-purple-400 hover:text-white transition-all print:hidden";

  return (
    <button onClick={goBack} aria-label="Go back to previous page" className={cls}>
      <ArrowLeft className={inline ? "w-3.5 h-3.5" : "w-4 h-4"} /> {canGoBack ? "Back" : `Back to ${home.label}`}
    </button>
  );
}