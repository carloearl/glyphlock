/**
 * GlyphLock Mobile Responsive Styles
 * Injected at runtime to avoid CSS import issues
 */

export const injectMobileStyles = () => {
  if (typeof document === 'undefined') return;
  
  const styleId = 'glyphlock-mobile-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
/* GlyphLock Mobile Responsive Layer - Bonded Scaling System */

:root {
  --mobile-scale-hero: 1;
  --mobile-scale-bg: 1;
  --mobile-scale-ui: 1;
  --mobile-scale-cursor: 1;
  --mobile-safe-top: env(safe-area-inset-top, 0px);
  --mobile-safe-bottom: env(safe-area-inset-bottom, 0px);
  --mobile-safe-left: env(safe-area-inset-left, 0px);
  --mobile-safe-right: env(safe-area-inset-right, 0px);
}

@media (max-width: 760px) {
  input, textarea, select { font-size: 16px !important; }
  body { min-height: -webkit-fill-available; -webkit-text-size-adjust: 100%; }
  html { height: -webkit-fill-available; }
  * { -webkit-overflow-scrolling: touch; }

  :root { --mobile-scale-hero: 0.75; --mobile-scale-ui: 1.0; --mobile-scale-bg: 0.8; --mobile-scale-cursor: 1.2; }

  .hero-section, [class*="hero"] { transform: scale(var(--mobile-scale-hero)); transform-origin: center top; }
  .hero-section h1, .hero-section .hero-title { font-size: calc(3rem * var(--mobile-scale-hero)); line-height: 1.1; }
  .hero-section p { font-size: calc(1.125rem * var(--mobile-scale-hero)); }

  .interactive-nebula, [class*="nebula"], [class*="background"] { transform: scale(var(--mobile-scale-bg)); transform-origin: center center; }
  [data-particle-system] { --particle-density: 0.6; }

  [class*="cursor"], [data-cursor] { transform: scale(var(--mobile-scale-cursor)); pointer-events: none; }

  nav, header nav { padding: 1rem; }
  nav a, nav button { min-height: 44px; min-width: 44px; padding: 0.75rem 1.25rem; }
  .btn, button { min-height: 44px; padding: 0.75rem 1.5rem; }
  [class*="floating"] { width: 56px; height: 56px; bottom: calc(24px + var(--mobile-safe-bottom)); right: calc(24px + var(--mobile-safe-right)); }

  .container { padding-left: max(1rem, var(--mobile-safe-left)); padding-right: max(1rem, var(--mobile-safe-right)); }
  .grid { grid-template-columns: 1fr !important; gap: 1.5rem; }
  section { padding-top: 3rem; padding-bottom: 3rem; }

  h1 { font-size: clamp(2rem, 5vw, 3rem); line-height: 1.1; }
  h2 { font-size: clamp(1.75rem, 4vw, 2.5rem); }
  h3 { font-size: clamp(1.5rem, 3.5vw, 2rem); }
  p { font-size: 1rem; line-height: 1.6; }

  .card, .glass-card { padding: calc(1.5rem * var(--mobile-scale-ui)); }
  [role="dialog"], .modal { max-width: 100vw; max-height: 100dvh; padding-top: var(--mobile-safe-top); padding-bottom: var(--mobile-safe-bottom); }
}

@media (max-width: 600px) {
  :root { --mobile-scale-hero: 0.65; --mobile-scale-ui: 1.05; }
  .hero-section h1 { font-size: calc(2.5rem * var(--mobile-scale-hero)); }
  nav a, nav button { min-height: 44px; }
  .btn, button { min-height: 44px; }
}

@media (max-width: 480px) {
  :root { --mobile-scale-hero: 0.55; --mobile-scale-ui: 1.1; --mobile-scale-bg: 0.7; }
  .hero-section h1 { font-size: calc(2rem * var(--mobile-scale-hero)); }
  nav a, nav button { min-height: 44px; }
  .btn, button { min-height: 44px; }
  section { padding-top: 2.5rem; padding-bottom: 2.5rem; }
  [data-particle-system] { --particle-density: 0.4; }
}

@media (max-width: 380px) {
  :root { --mobile-scale-hero: 0.5; }
}

@media (hover: none) and (pointer: coarse) {
  [class*="cursor"]:not(.mobile-touch-indicator) { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .interactive-nebula, [class*="animated"] { animation: none !important; transition: none !important; }
  [data-particle-system] { opacity: 0.3; }
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

@media (orientation: landscape) and (max-height: 500px) {
  :root { --mobile-scale-hero: 0.6; --mobile-scale-ui: 1.1; }
}

@media (max-width: 760px) {
  *:focus-visible { outline: 2px solid #00E4FF; outline-offset: 2px; }
}
  `;

  document.head.appendChild(style);
};