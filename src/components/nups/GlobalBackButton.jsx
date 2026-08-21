import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getOperatorHome } from "@/lib/nups/roleHomes";
import { canGoBack, popBack } from "@/lib/nups/navStack";

/**
 * Universal back button — consumes the central nav stack recorded at router
 * level (see App.jsx + lib/nups/navStack.js), so it works on every page,
 * not only pages that happened to keep the button mounted.
 * Hidden when there is nowhere to go back to.
 */
export default function GlobalBackButton({ inline = false }) {
  const location = useLocation(); // re-render on every route change
  const navigate = useNavigate();
  const home = getOperatorHome();
  const onHomePage = home && location.pathname.toLowerCase() === home.path.toLowerCase();
  const hasBack = canGoBack();
  // Marketing/content pages where a floating back button is redundant — navbar handles navigation.
  const isContentPage = ["/about", "/aboutcarlo", "/contact", "/privacy", "/terms", "/faq", "/services", "/pricing", "/roadmap", "/partners"].some(
    (p) => location.pathname.toLowerCase() === p || location.pathname.toLowerCase().startsWith(p + "/")
  );

  const goBack = () => {
    const prev = popBack();
    if (prev) navigate(prev);
    else if (home && !onHomePage) navigate(home.path); // fall back to role dashboard
  };

  // Nothing to go back to AND no role dashboard to fall back to (or already there)
  if (!hasBack && (!home || onHomePage)) return null;

  // Hide on content/marketing pages where the navbar already provides navigation
  if (isContentPage) return null;

  // Inline variant — lives inside the kiosk top strip so it never overlays
  // page content (overlay audit 2026-07-17).
  const cls = inline
    ? "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold text-cyan-300/80 border border-cyan-500/20 hover:border-cyan-400/50 hover:text-white transition-colors print:hidden"
    : "fixed bottom-5 left-5 z-[9999] flex items-center gap-2 rounded-full bg-slate-900/90 border-2 border-purple-500/40 text-purple-200 text-sm font-bold px-5 py-3 min-h-[44px] shadow-lg shadow-purple-900/40 backdrop-blur hover:border-purple-400 hover:text-white transition-all print:hidden";

  return (
    <button onClick={goBack} aria-label="Go back to previous page" className={cls}>
      <ArrowLeft className={inline ? "w-3.5 h-3.5" : "w-4 h-4"} /> {hasBack ? "Back" : `Back to ${home.label}`}
    </button>
  );
}