import { useEffect } from 'react';

/**
 * Enhanced Mobile Touch Optimizer for Samsung S25+ and All Mobile Devices
 * - Fixes button interaction issues
 * - Ensures card flips work reliably
 * - Prevents accidental scroll navigation
 * - Optimizes all touch event handling
 */
export default function MobileTouchOptimizer() {
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Viewport setup
    const setViewport = () => {
      let viewport = document.querySelector('meta[name=viewport]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
      }
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
    };

    // Prevent iOS zoom on input focus
    const preventInputZoom = () => {
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        if (!input.style.fontSize || parseFloat(input.style.fontSize) < 16) {
          input.style.fontSize = '16px';
        }
      });
    };

    // Enhanced touch event normalization with scroll detection
    const normalizeTouchEvents = () => {
      const interactiveElements = document.querySelectorAll('button, a, input, textarea, select, [role="button"], [onclick], [class*="cursor-pointer"]');
      
      interactiveElements.forEach(el => {
        // Set proper touch action based on element type
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
          el.style.touchAction = 'pan-y pinch-zoom';
        } else {
          el.style.touchAction = 'manipulation';
        }
        el.style.webkitTapHighlightColor = 'transparent';
        el.style.userSelect = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? 'text' : 'none';
        
        // Ensure minimum touch target for buttons/links only
        if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button') {
          const rect = el.getBoundingClientRect();
          if (rect.width < 44 || rect.height < 44) {
            const currentPadding = window.getComputedStyle(el).padding;
            if (currentPadding === '0px') {
              el.style.minWidth = '44px';
              el.style.minHeight = '44px';
              el.style.display = 'inline-flex';
              el.style.alignItems = 'center';
              el.style.justifyContent = 'center';
            }
          }
        }

        // Remove existing handlers
        if (el._glyphTouchStart) el.removeEventListener('touchstart', el._glyphTouchStart);
        if (el._glyphTouchMove) el.removeEventListener('touchmove', el._glyphTouchMove);
        if (el._glyphTouchEnd) el.removeEventListener('touchend', el._glyphTouchEnd);

        // Track touch state
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        let hasMoved = false;

        // Touch start handler
        const touchStartHandler = (e) => {
          const touch = e.touches[0];
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
          touchStartTime = Date.now();
          hasMoved = false;
        };

        // Touch move handler - detect if user is scrolling
        const touchMoveHandler = (e) => {
          const touch = e.touches[0];
          const deltaX = Math.abs(touch.clientX - touchStartX);
          const deltaY = Math.abs(touch.clientY - touchStartY);
          
          // If moved more than 10px, consider it a scroll
          if (deltaX > 10 || deltaY > 10) {
            hasMoved = true;
          }
        };

        // Touch end handler - only trigger click if not scrolling
        const touchEndHandler = (e) => {
          const touchDuration = Date.now() - touchStartTime;
          const touch = e.changedTouches[0];
          const target = document.elementFromPoint(touch.clientX, touch.clientY);
          
          // Only trigger click if:
          // 1. Touch didn't move (not scrolling)
          // 2. Touch was quick (< 500ms)
          // 3. Touch ended on the same element
          if (!hasMoved && touchDuration < 500 && (target === el || el.contains(target))) {
            // For input fields, just let them focus naturally
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
              el.focus();
              return;
            }
            
            // For links and buttons, prevent default and trigger click
            e.preventDefault();
            e.stopPropagation();
            el.click();
          }
        };

        el._glyphTouchStart = touchStartHandler;
        el._glyphTouchMove = touchMoveHandler;
        el._glyphTouchEnd = touchEndHandler;

        el.addEventListener('touchstart', touchStartHandler, { passive: true });
        el.addEventListener('touchmove', touchMoveHandler, { passive: true });
        el.addEventListener('touchend', touchEndHandler, { passive: false });
      });
    };

    // Fix scroll snap issues
    const fixScrollSnap = () => {
      document.body.style.overscrollBehavior = 'auto';
      document.documentElement.style.overscrollBehavior = 'auto';
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      
      // Disable scroll-snap on mobile to prevent accidental navigation
      const snapContainers = document.querySelectorAll('[style*="scroll-snap"]');
      snapContainers.forEach(container => {
        container.style.scrollSnapType = 'none';
      });
    };

    // Apply all fixes
    setViewport();
    preventInputZoom();
    normalizeTouchEvents();
    fixScrollSnap();

    // Re-apply on DOM changes with debounce
    let timeoutId;
    const observer = new MutationObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        preventInputZoom();
        normalizeTouchEvents();
        fixScrollSnap();
      }, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  return null;
}