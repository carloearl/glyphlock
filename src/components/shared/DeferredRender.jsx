import React, { Suspense, useEffect, useRef, useState } from 'react';

export default function DeferredRender({ children, minHeight = 240 }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setReady(true),
      { rootMargin: '500px 0px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ready]);

  return (
    <div ref={ref} style={{ minHeight: ready ? undefined : minHeight }}>
      {ready && <Suspense fallback={null}>{children}</Suspense>}
    </div>
  );
}