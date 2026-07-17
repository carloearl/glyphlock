import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const KEY = "gl_nav_stack";

const readStack = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch { return []; }
};

/**
 * Universal back button — tracks the exact in-app navigation trail
 * (path + query) in session storage and returns the user to the precise
 * page they came from. Hidden when there is nowhere to go back to.
 */
export default function GlobalBackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const [canGoBack, setCanGoBack] = useState(false);

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
    if (stack.length < 2) return;
    stack.pop();
    sessionStorage.setItem(KEY, JSON.stringify(stack));
    navigate(stack[stack.length - 1]);
  };

  if (!canGoBack) return null;

  return (
    <button
      onClick={goBack}
      aria-label="Go back to previous page"
      className="fixed bottom-5 left-5 z-[9999] flex items-center gap-2 rounded-full bg-slate-900/90 border-2 border-purple-500/40 text-purple-200 text-sm font-bold px-5 py-3 min-h-[44px] shadow-lg shadow-purple-900/40 backdrop-blur hover:border-purple-400 hover:text-white transition-all print:hidden"
    >
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );
}