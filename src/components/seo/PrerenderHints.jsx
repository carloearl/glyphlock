/**
 * PrerenderHints
 *
 * Signals that a lazily loaded route has painted without taking ownership of
 * SEO metadata. SEOHead remains the only runtime writer for robots, canonical,
 * Open Graph, and Twitter tags.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function PrerenderHints() {
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    let firstFrame = 0;
    let secondFrame = 0;
    let settleTimer = 0;

    window.prerenderReady = false;

    const signalReady = () => {
      if (cancelled) return;
      window.prerenderReady = true;
      window.dispatchEvent(new CustomEvent('prerenderReady', {
        detail: { path: location.pathname },
      }));
    };

    // The component mounts only after the route's lazy chunk resolves. Two
    // animation frames plus a short settle window let SEOHead effects and the
    // route's static above-the-fold markup reach the DOM before capture.
    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        settleTimer = window.setTimeout(signalReady, 100);
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(settleTimer);
    };
  }, [location.pathname]);

  return null;
}
