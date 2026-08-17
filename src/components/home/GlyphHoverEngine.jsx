import { useEffect } from 'react';

const GLYPHS = [
  'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ',
  '⌬', '⟁', '⟟', '⧉', '⌁', '⟡', '⍟', '⏣',
  '⎈', '◈', '✦', '⧖', '⧗', '⫷', '⫸', '⎔',
];

const TARGET_SELECTOR = [
  '.gl-home h1',
  '.gl-home h2',
  '.gl-home h3',
  '.gl-home a',
  '.gl-home button',
  '.gl-home .font-black',
  '.gl-home .font-bold',
  '.gl-home [data-glyph-hover]',
].join(',');

const SKIP_SELECTOR = '[data-no-glyph], input, textarea, select, option, code, pre';

function isMorphableCharacter(char) {
  return /[A-Za-z0-9]/.test(char);
}

function collectTextNodes(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || parent.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
        if (parent.closest('[aria-hidden="true"]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  const nodes = [];
  let cursor = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const original = node.nodeValue;
    nodes.push({ node, original, start: cursor });
    cursor += original.length;
  }

  return {
    nodes,
    length: cursor,
    accessibleText: nodes.map(({ original }) => original).join(' ').replace(/\s+/g, ' ').trim(),
  };
}

export default function GlyphHoverEngine() {
  useEffect(() => {
    const root = document.querySelector('.gl-home');
    if (!root) return undefined;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const cache = new WeakMap();
    let activeTarget = null;
    let activeIndex = -1;
    let tick = 0;
    let flickerTimer = null;
    let touchRestoreTimer = null;
    let sweepTimer = null;

    const getState = (element) => {
      if (!cache.has(element)) cache.set(element, collectTextNodes(element));
      return cache.get(element);
    };

    const restore = (element) => {
      if (!element) return;
      const state = cache.get(element);
      state?.nodes.forEach(({ node, original }) => {
        if (node.isConnected) node.nodeValue = original;
      });
      element.removeAttribute('data-glyph-active');
      element.style.removeProperty('--glyph-focus-x');
      if (element.getAttribute('data-glyph-aria-owned') === 'true') {
        element.removeAttribute('aria-label');
        element.removeAttribute('data-glyph-aria-owned');
      }
    };

    const render = (element, center, radius = 2) => {
      if (!element || reduceMotion) return;
      const state = getState(element);
      if (!state?.length) return;

      state.nodes.forEach(({ node, original, start }) => {
        if (!node.isConnected) return;
        node.nodeValue = Array.from(original)
          .map((char, localIndex) => {
            const globalIndex = start + localIndex;
            const distance = Math.abs(globalIndex - center);
            if (!isMorphableCharacter(char) || distance > radius) return char;
            const glyphIndex = Math.abs(globalIndex * 7 + tick * 5 + Math.round(distance * 3)) % GLYPHS.length;
            return GLYPHS[glyphIndex];
          })
          .join('');
      });

      element.setAttribute('data-glyph-active', 'true');
      if (!element.hasAttribute('aria-label') && state.accessibleText) {
        element.setAttribute('aria-label', state.accessibleText);
        element.setAttribute('data-glyph-aria-owned', 'true');
      }
      const ratio = state.length > 1 ? center / (state.length - 1) : 0.5;
      element.style.setProperty('--glyph-focus-x', `${Math.max(0, Math.min(1, ratio)) * 100}%`);
    };

    const stopTimers = () => {
      if (flickerTimer) window.clearInterval(flickerTimer);
      if (touchRestoreTimer) window.clearTimeout(touchRestoreTimer);
      if (sweepTimer) window.clearInterval(sweepTimer);
      flickerTimer = null;
      touchRestoreTimer = null;
      sweepTimer = null;
    };

    const activate = (element, center) => {
      if (!element || reduceMotion) return;
      if (activeTarget && activeTarget !== element) restore(activeTarget);
      activeTarget = element;
      activeIndex = center;
      tick += 1;
      render(element, center, 1);

      if (!flickerTimer) {
        flickerTimer = window.setInterval(() => {
          if (!activeTarget || activeIndex < 0) return;
          tick += 1;
          render(activeTarget, activeIndex, 1);
        }, 160);
      }
    };

    const targetFromEvent = (event) => {
      const element = event.target instanceof Element ? event.target.closest(TARGET_SELECTOR) : null;
      if (!element || !root.contains(element) || element.matches(SKIP_SELECTOR)) return null;
      return element;
    };

    const indexFromPointer = (element, event) => {
      const state = getState(element);
      if (!state?.length) return -1;
      const rect = element.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
      const ratio = rect.width > 0 ? x / rect.width : 0.5;
      return Math.max(0, Math.min(state.length - 1, Math.round(ratio * (state.length - 1))));
    };

    const onPointerMove = (event) => {
      if (event.pointerType === 'touch') return;
      const target = targetFromEvent(event);
      if (!target) {
        if (activeTarget) restore(activeTarget);
        activeTarget = null;
        activeIndex = -1;
        stopTimers();
        return;
      }
      const index = indexFromPointer(target, event);
      if (index >= 0) activate(target, index);
    };

    const onPointerOut = (event) => {
      const target = targetFromEvent(event);
      if (!target) return;
      const next = event.relatedTarget instanceof Node ? event.relatedTarget : null;
      if (next && target.contains(next)) return;
      restore(target);
      if (activeTarget === target) {
        activeTarget = null;
        activeIndex = -1;
        stopTimers();
      }
    };

    const onPointerDown = (event) => {
      const target = targetFromEvent(event);
      if (!target || event.pointerType !== 'touch') return;
      const state = getState(target);
      if (!state?.length) return;
      const startingIndex = indexFromPointer(target, event);
      activate(target, startingIndex >= 0 ? startingIndex : 0);

      let sweep = startingIndex >= 0 ? startingIndex : 0;
      if (sweepTimer) window.clearInterval(sweepTimer);
      sweepTimer = window.setInterval(() => {
        sweep = (sweep + 1) % state.length;
        activeIndex = sweep;
        tick += 1;
        render(target, sweep, 1);
      }, 110);

      if (touchRestoreTimer) window.clearTimeout(touchRestoreTimer);
      touchRestoreTimer = window.setTimeout(() => {
        restore(target);
        activeTarget = null;
        activeIndex = -1;
        stopTimers();
      }, 760);
    };

    const onFocusIn = (event) => {
      const target = targetFromEvent(event);
      if (!target || reduceMotion) return;
      const state = getState(target);
      if (!state?.length) return;
      let sweep = 0;
      activate(target, sweep);
      if (sweepTimer) window.clearInterval(sweepTimer);
      sweepTimer = window.setInterval(() => {
        sweep += 1;
        if (sweep >= state.length) {
          window.clearInterval(sweepTimer);
          sweepTimer = null;
          restore(target);
          return;
        }
        activeIndex = sweep;
        tick += 1;
        render(target, sweep, 1);
      }, 110);
    };

    const onFocusOut = (event) => {
      const target = targetFromEvent(event);
      if (!target) return;
      restore(target);
      if (activeTarget === target) {
        activeTarget = null;
        activeIndex = -1;
        stopTimers();
      }
    };

    root.addEventListener('pointermove', onPointerMove, { passive: true });
    root.addEventListener('pointerout', onPointerOut, { passive: true });
    root.addEventListener('pointerdown', onPointerDown, { passive: true });
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);

    return () => {
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerout', onPointerOut);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
      restore(activeTarget);
      stopTimers();
    };
  }, []);

  return null;
}