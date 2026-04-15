/* Mobile Layout Fix - Prevents horizontal scroll and overflow issues */

@media (max-width: 768px) {
  /* Force vertical stacking for all grid layouts on mobile */
  .grid:not(.stats-grid):not(.preserve-cols) {
    display: flex !important;
    flex-direction: column !important;
    gap: 1rem !important;
  }

  /* Prevent cards from causing overflow */
  [class*="Card"],
  .card,
  [class*="card-"] {
    max-width: 100%;
    overflow-x: hidden;
  }

  /* Fix absolute positioning that breaks mobile */
  .glyph-orb,
  [class*="orb"],
  [class*="particle"] {
    display: none !important;
  }

  /* Ensure no element exceeds viewport width */
  * {
    max-width: 100vw;
  }

  /* Fix tables on mobile */
  table {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Mobile-friendly spacing */
  .section-padding {
    padding: 2rem 1rem !important;
  }

  /* Fix modal/dialog overflow */
  [role="dialog"],
  [data-radix-dialog-content] {
    max-width: calc(100vw - 32px) !important;
    margin: 16px !important;
  }

  /* Bottom navigation safe area */
  .mobile-bottom-actions {
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }

  /* Collapsible sections instead of side-by-side */
  .desktop-sidebar {
    display: none !important;
  }

  /* Full-width mobile containers */
  .container,
  [class*="container"] {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
  }

  /* Prevent text overflow */
  h1, h2, h3, h4, h5, h6, p {
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  }

  /* Mobile-safe animations */
  @media (prefers-reduced-motion: no-preference) {
    * {
      animation-duration: 0.3s !important;
    }
  }

  /* Ensure buttons are thumb-reachable */
  .floating-action-button,
  .fab {
    bottom: max(24px, calc(24px + env(safe-area-inset-bottom)));
    right: 16px;
  }

  /* Fix nested flex/grid causing overflow */
  .flex > .grid,
  .grid > .flex {
    min-width: 0;
    max-width: 100%;
  }

  /* Mobile form improvements */
  form {
    max-width: 100%;
    overflow-x: hidden;
  }

  input, textarea, select {
    max-width: 100%;
    width: 100% !important;
  }

  /* Prevent code blocks from overflowing */
  code, pre {
    max-width: 100%;
    overflow-x: auto;
    word-break: break-all;
  }

  /* Tab lists should scroll horizontally if needed */
  [role="tablist"] {
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  [role="tablist"]::-webkit-scrollbar {
    display: none;
  }

  /* Ensure proper spacing for stacked elements */
  .flex.flex-col > *:not(:last-child),
  .space-y-6 > *:not(:last-child),
  .space-y-4 > *:not(:last-child) {
    margin-bottom: 1rem;
  }
}