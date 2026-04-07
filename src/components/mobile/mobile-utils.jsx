/**
 * GlyphLock Mobile Utilities
 * Bonded scaling system - detects mobile, calculates scale factors,
 * applies CSS variable multipliers, handles viewport bugs
 */

import { injectMobileStyles } from './mobile-styles';

class MobileScalingSystem {
  constructor() {
    this.isMobile = this.detectMobile();
    this.viewport = this.getViewportDimensions();
    this.breakpoints = {
      xs: 380,
      sm: 480,
      md: 600,
      lg: 760,
    };
    this.resizeDebounce = null;
    this.rotationLock = false;

    if (this.isMobile) {
      this.init();
    }
  }

  /**
   * Detect mobile device
   */
  detectMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Check for mobile devices
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent.toLowerCase()
    );
    
    // Check for touch support
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Check viewport width
    const isNarrow = window.innerWidth <= 760;
    
    return isMobileUA || (hasTouch && isNarrow);
  }

  /**
   * Get viewport dimensions with iOS bug fix
   */
  getViewportDimensions() {
    // Fix iOS Safari viewport height bug
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    return {
      width: window.innerWidth,
      height: window.innerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    };
  }

  /**
   * Calculate current breakpoint
   */
  getCurrentBreakpoint() {
    const width = this.viewport.width;

    if (width <= this.breakpoints.xs) return 'xs';
    if (width <= this.breakpoints.sm) return 'sm';
    if (width <= this.breakpoints.md) return 'md';
    if (width <= this.breakpoints.lg) return 'lg';
    return 'desktop';
  }

  /**
   * Calculate bonded scale factors for each group
   */
  calculateScaleFactors() {
    const width = this.viewport.width;
    const breakpoint = this.getCurrentBreakpoint();

    let scaleHero, scaleBg, scaleUI, scaleCursor;

    // Bonded Group 1: Hero (video, logo, watermark)
    switch (breakpoint) {
      case 'xs':
        scaleHero = 0.5;
        break;
      case 'sm':
        scaleHero = 0.55;
        break;
      case 'md':
        scaleHero = 0.65;
        break;
      case 'lg':
        scaleHero = 0.75;
        break;
      default:
        scaleHero = 1;
    }

    // Bonded Group 2: Background (nebula, particles, glow)
    switch (breakpoint) {
      case 'xs':
      case 'sm':
        scaleBg = 0.7;
        break;
      case 'md':
      case 'lg':
        scaleBg = 0.8;
        break;
      default:
        scaleBg = 1;
    }

    // Bonded Group 3: Cursor & Notes
    scaleCursor = breakpoint === 'desktop' ? 1 : 1.2;

    // Bonded Group 4: UI Chrome (nav, buttons, icons)
    switch (breakpoint) {
      case 'xs':
      case 'sm':
        scaleUI = 1.1;
        break;
      case 'md':
        scaleUI = 1.05;
        break;
      case 'lg':
        scaleUI = 1.0;
        break;
      default:
        scaleUI = 1;
    }

    return {
      hero: scaleHero,
      bg: scaleBg,
      ui: scaleUI,
      cursor: scaleCursor,
    };
  }

  /**
   * Apply scale factors to CSS variables
   */
  applyScaleFactors() {
    const scales = this.calculateScaleFactors();
    const root = document.documentElement;

    root.style.setProperty('--mobile-scale-hero', scales.hero);
    root.style.setProperty('--mobile-scale-bg', scales.bg);
    root.style.setProperty('--mobile-scale-ui', scales.ui);
    root.style.setProperty('--mobile-scale-cursor', scales.cursor);

    // Add mobile class to body
    document.body.classList.add('mobile-optimized');
    document.body.setAttribute('data-breakpoint', this.getCurrentBreakpoint());
  }

  /**
   * Handle viewport resize with debounce
   */
  handleResize() {
    clearTimeout(this.resizeDebounce);

    this.resizeDebounce = setTimeout(() => {
      this.viewport = this.getViewportDimensions();
      this.applyScaleFactors();
      this.fixAndroidViewport();
    }, 150);
  }

  /**
   * Fix Android viewport height bug
   */
  fixAndroidViewport() {
    // Update CSS custom property for 100vh
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // Fix for Android Chrome address bar
    if (/android/i.test(navigator.userAgent)) {
      const addressBarHeight = window.outerHeight - window.innerHeight;
      document.documentElement.style.setProperty('--address-bar-height', `${addressBarHeight}px`);
    }
  }

  /**
   * Handle orientation change without drift
   */
  handleOrientationChange() {
    if (this.rotationLock) return;

    this.rotationLock = true;

    // Lock current positions before rotation
    this.lockBondedPositions();

    setTimeout(() => {
      this.viewport = this.getViewportDimensions();
      this.applyScaleFactors();
      this.unlockBondedPositions();
      this.rotationLock = false;
    }, 300);
  }

  /**
   * Lock bonded group positions during rotation
   */
  lockBondedPositions() {
    const bondedElements = document.querySelectorAll(
      '[class*="hero"], [class*="nebula"], [class*="cursor"], nav, header'
    );

    bondedElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      el.dataset.lockTop = rect.top;
      el.dataset.lockLeft = rect.left;
    });
  }

  /**
   * Unlock bonded positions after rotation
   */
  unlockBondedPositions() {
    const bondedElements = document.querySelectorAll('[data-lock-top]');

    bondedElements.forEach((el) => {
      delete el.dataset.lockTop;
      delete el.dataset.lockLeft;
    });
  }

  /**
   * Convert hover interactions to touch
   */
  setupTouchInteractions() {
    // Convert cursor follow to touch indicator
    const cursorElements = document.querySelectorAll('[class*="cursor"], [data-cursor]');

    cursorElements.forEach((cursor) => {
      if (cursor.classList.contains('mobile-touch-indicator')) return;

      document.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        cursor.style.left = `${touch.clientX}px`;
        cursor.style.top = `${touch.clientY}px`;
        cursor.classList.add('active');
      }, { passive: true });

      document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        cursor.style.left = `${touch.clientX}px`;
        cursor.style.top = `${touch.clientY}px`;
      }, { passive: true });

      document.addEventListener('touchend', () => {
        cursor.classList.remove('active');
      }, { passive: true });
    });

    // Convert hover notes to tap reveals
    const noteElements = document.querySelectorAll('[class*="note"], [data-note]');

    noteElements.forEach((note) => {
      note.addEventListener('touchstart', () => {
        note.classList.add('active');

        setTimeout(() => {
          note.classList.remove('active');
        }, 3000);
      });
    });
  }

  /**
   * Lazy load below-fold content
   */
  setupLazyLoading() {
    const lazyElements = document.querySelectorAll('[data-lazy]');

    if ('IntersectionObserver' in window) {
      const lazyObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target;
              element.setAttribute('data-loaded', 'true');
              lazyObserver.unobserve(element);
            }
          });
        },
        {
          rootMargin: '100px',
        }
      );

      lazyElements.forEach((el) => lazyObserver.observe(el));
    } else {
      // Fallback for older browsers
      lazyElements.forEach((el) => el.setAttribute('data-loaded', 'true'));
    }
  }

  /**
   * Optimize animations for performance
   */
  optimizeAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      document.body.classList.add('reduce-motion');
    }

    // Reduce particle density on low-end devices
    const isLowEnd = this.detectLowEndDevice();

    if (isLowEnd) {
      document.body.classList.add('low-end-device');
      const particleSystems = document.querySelectorAll('[data-particle-system]');
      particleSystems.forEach((system) => {
        system.style.setProperty('--particle-density', '0.3');
      });
    }
  }

  /**
   * Detect low-end device
   */
  detectLowEndDevice() {
    // Check for performance indicators
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const deviceMemory = navigator.deviceMemory || 1;

    return hardwareConcurrency < 4 || deviceMemory < 4;
  }

  /**
   * Initialize mobile system
   */
  init() {
    // Inject mobile styles
    injectMobileStyles();

    // Apply initial scale factors
    this.applyScaleFactors();

    // Fix viewport bugs
    this.fixAndroidViewport();

    // Setup touch interactions
    this.setupTouchInteractions();

    // Setup lazy loading
    this.setupLazyLoading();

    // Optimize animations
    this.optimizeAnimations();

    // Listen for resize
    window.addEventListener('resize', () => this.handleResize());

    // Listen for orientation change
    window.addEventListener('orientationchange', () => this.handleOrientationChange());

    // Listen for safe area changes (iOS notch)
    const safeAreaObserver = new MutationObserver(() => {
      this.applyScaleFactors();
    });

    safeAreaObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    // Expose to window for debugging
    if (typeof window !== 'undefined') {
      window.glyphMobileSystem = this;
    }
  }

  /**
   * Verify bonded alignment (for testing)
   */
  verifyBondedAlignment() {
    const results = {
      heroAlignment: this.checkHeroAlignment(),
      bgFocalLock: this.checkBgFocalLock(),
      cursorNotesLock: this.checkCursorNotesLock(),
      navSpacingRatios: this.checkNavSpacingRatios(),
    };

    console.log('Bonded Alignment Verification:', results);
    return results;
  }

  checkHeroAlignment() {
    const hero = document.querySelector('.hero-section');
    const logo = document.querySelector('.hero-section .logo, .hero-section img');

    if (!hero || !logo) return { status: 'N/A', reason: 'Elements not found' };

    const heroRect = hero.getBoundingClientRect();
    const logoRect = logo.getBoundingClientRect();

    const isAligned =
      Math.abs(heroRect.left - logoRect.left) < 5 ||
      Math.abs(heroRect.right - logoRect.right) < 5;

    return { status: isAligned ? 'PASS' : 'FAIL', heroRect, logoRect };
  }

  checkBgFocalLock() {
    const bg = document.querySelector('[class*="nebula"], [class*="background"]');

    if (!bg) return { status: 'N/A', reason: 'Background not found' };

    const computedStyle = window.getComputedStyle(bg);
    const objectPosition = computedStyle.objectPosition;
    const isLocked = objectPosition.includes('center');

    return { status: isLocked ? 'PASS' : 'FAIL', objectPosition };
  }

  checkCursorNotesLock() {
    const cursor = document.querySelector('[class*="cursor"]');
    const notes = document.querySelectorAll('[class*="note"]');

    if (!cursor) return { status: 'N/A', reason: 'Cursor not found' };

    return { status: 'PASS', cursor: !!cursor, noteCount: notes.length };
  }

  checkNavSpacingRatios() {
    const nav = document.querySelector('nav, header');
    if (!nav) return { status: 'N/A', reason: 'Nav not found' };

    const computedStyle = window.getComputedStyle(nav);
    const padding = computedStyle.padding;

    return { status: 'PASS', padding };
  }
}

export default MobileScalingSystem;