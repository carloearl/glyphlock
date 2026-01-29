import { useEffect } from 'react';

/**
 * Mobile Scroll Fix - Phase 2
 * Ensures natural scrolling works on all mobile devices
 * Prevents scroll blocking, overflow issues, and touch conflicts
 */
export default function MobileScrollFix() {
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Reset scroll behavior
    const resetScroll = () => {
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.overflowX = 'hidden';
      document.documentElement.style.overflowY = 'auto';
      document.body.style.overflow = 'auto';
      document.body.style.overflowX = 'hidden';
      document.body.style.overflowY = 'auto';
      document.body.style.position = 'relative';
      document.body.style.height = 'auto';
      document.body.style.minHeight = '100vh';
    };

    // Remove scroll blocking from fixed elements
    const fixFixedElements = () => {
      const fixedElements = document.querySelectorAll('[style*="position: fixed"], [class*="fixed"]');
      fixedElements.forEach(el => {
        // Skip nebula and background elements
        if (el.id?.includes('nebula') || el.classList.contains('nebula-layer-container')) {
          el.style.pointerEvents = 'none';
          el.style.touchAction = 'none';
          return;
        }
        // Nav and important UI should not block scroll
        if (!el.classList.contains('dino-fab') && !el.classList.contains('dino-chat-container')) {
          el.style.overscrollBehavior = 'contain';
        }
      });
    };

    // Ensure main content areas are scrollable
    const enableContentScroll = () => {
      const mainElements = document.querySelectorAll('main, [role="main"], .main-content');
      mainElements.forEach(el => {
        el.style.overflowY = 'visible';
        el.style.overflowX = 'hidden';
        el.style.height = 'auto';
        el.style.minHeight = 'auto';
      });
    };

    // Fix grid overflow on mobile
    const fixGridOverflow = () => {
      const grids = document.querySelectorAll('.grid, [class*="grid-cols"]');
      grids.forEach(grid => {
        const rect = grid.getBoundingClientRect();
        if (rect.width > window.innerWidth) {
          grid.style.maxWidth = '100%';
          grid.style.overflowX = 'auto';
        }
      });
    };

    // Apply fixes
    resetScroll();
    fixFixedElements();
    enableContentScroll();
    fixGridOverflow();

    // Reapply on content changes
    const observer = new MutationObserver(() => {
      resetScroll();
      fixFixedElements();
      enableContentScroll();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Handle window resize
    const handleResize = () => {
      resetScroll();
      fixGridOverflow();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        resetScroll();
        fixGridOverflow();
      }, 100);
    });

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return null;
}