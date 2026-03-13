import React, { useEffect, useState, useRef } from 'react';

/**
 * Mobile Optimization Layer
 * Detects device capabilities and applies performance optimizations
 */
export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [deviceTier, setDeviceTier] = useState('high'); // high, medium, low
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      setIsMobile(mobile);
      setViewportWidth(width);

      // Device tier detection based on performance metrics
      const memory = navigator.deviceMemory || 4;
      const cores = navigator.hardwareConcurrency || 2;
      const connection = navigator.connection?.effectiveType || '4g';

      let tier = 'high';
      if (mobile && (memory < 4 || cores < 4 || connection === '3g' || connection === '2g')) {
        tier = 'low';
      } else if (mobile && (memory < 6 || cores < 6)) {
        tier = 'medium';
      }
      setDeviceTier(tier);
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  return { isMobile, deviceTier, viewportWidth };
};

/**
 * Optimized Image Component
 * Uses Base44/Wix Media Manager for dynamic resizing
 */
export const OptimizedImage = ({ 
  src, 
  alt, 
  className = '',
  loading = 'lazy',
  priority = false 
}) => {
  const { viewportWidth, deviceTier } = useMobileOptimization();

  const getOptimizedSrc = () => {
    if (!src) return '';

    // For Base44/Supabase storage URLs, add transformation parameters
    if (src.includes('supabase.co/storage')) {
      const url = new URL(src);
      
      // Calculate optimal width based on viewport and device tier
      let targetWidth = viewportWidth;
      if (deviceTier === 'low') targetWidth = Math.min(targetWidth, 640);
      else if (deviceTier === 'medium') targetWidth = Math.min(targetWidth, 1024);
      
      // Add transformation parameters
      url.searchParams.set('width', Math.ceil(targetWidth * (window.devicePixelRatio || 1)));
      url.searchParams.set('quality', deviceTier === 'low' ? '60' : '80');
      url.searchParams.set('format', 'webp');
      
      return url.toString();
    }

    return src;
  };

  return (
    <img
      src={getOptimizedSrc()}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : loading}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
    />
  );
};

/**
 * Mobile-Optimized Animation Wrapper
 * Replaces JS animations with CSS on mobile
 */
export const MobileAnimation = ({ 
  children, 
  type = 'fade', // fade, slide, scale, none
  duration = 300,
  delay = 0 
}) => {
  const { deviceTier } = useMobileOptimization();

  // Disable animations on low-tier devices
  if (deviceTier === 'low') {
    return <div className="motion-reduce">{children}</div>;
  }

  const animationClasses = {
    fade: 'animate-fade-in',
    slide: 'animate-slide-up',
    scale: 'animate-scale-in',
    none: ''
  };

  return (
    <div 
      className={animationClasses[type]}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
};

/**
 * Performance Monitor Hook
 * Tracks and logs performance metrics
 */
export const usePerformanceMonitor = (componentName) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 16) { // > 1 frame at 60fps
        console.warn(`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
};

/**
 * Lazy Load Wrapper
 * Delays rendering until component is in viewport
 */
export const LazyRender = ({ children, threshold = 0.1 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref}>
      {isVisible ? children : <div className="h-32 bg-slate-100 animate-pulse rounded" />}
    </div>
  );
};