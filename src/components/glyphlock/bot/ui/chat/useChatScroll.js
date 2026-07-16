import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * DACO 007 Phase B — smooth autoscroll with scroll-lock.
 * Auto-follows new messages while the user is at (or near) the bottom;
 * when the user scrolls up, auto-follow pauses and a "jump to latest"
 * affordance can be shown via `pinned === false`.
 */
export default function useChatScroll(dep) {
  const ref = useRef(null);
  const [pinned, setPinned] = useState(true);
  const pinnedRef = useRef(true);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    pinnedRef.current = atBottom;
    setPinned(atBottom);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    pinnedRef.current = true;
    setPinned(true);
  }, []);

  useEffect(() => {
    if (pinnedRef.current) {
      const el = ref.current;
      if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
    }
  }, [dep]);

  return { ref, pinned, onScroll, scrollToBottom };
}