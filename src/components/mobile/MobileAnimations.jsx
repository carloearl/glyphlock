/**
 * Mobile-Optimized CSS Animations
 * Lightweight alternatives to JavaScript animations
 * Uses GPU-accelerated transforms for better performance
 */

/* Disable animations for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Low-tier device optimizations */
.motion-reduce * {
  animation: none !important;
  transition: none !important;
}

/* Fade In Animation */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

/* Slide Up Animation */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translate3d(0, 20px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.animate-slide-up {
  animation: slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Scale In Animation */
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale3d(0.95, 0.95, 1);
  }
  to {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
}

.animate-scale-in {
  animation: scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Optimized Pulse (GPU-accelerated) */
@keyframes pulse-gpu {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse-gpu {
  animation: pulse-gpu 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  will-change: opacity;
}

/* Optimized Spin (GPU-accelerated) */
@keyframes spin-gpu {
  from {
    transform: rotate3d(0, 0, 1, 0deg);
  }
  to {
    transform: rotate3d(0, 0, 1, 360deg);
  }
}

.animate-spin-gpu {
  animation: spin-gpu 1s linear infinite;
  will-change: transform;
}

/* Skeleton Loading */
@keyframes skeleton-loading {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 0px, #f8f8f8 40px, #f0f0f0 80px);
  background-size: 200px 100%;
  animation: skeleton-loading 1.2s ease-in-out infinite;
}

/* Mobile-specific touch feedback */
@media (hover: none) and (pointer: coarse) {
  .touch-feedback {
    -webkit-tap-highlight-color: rgba(59, 130, 246, 0.1);
  }
  
  .touch-feedback:active {
    opacity: 0.7;
    transform: scale(0.98);
  }
}

/* Performance optimization hints */
.gpu-accelerate {
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Smooth scroll for mobile */
@media (max-width: 768px) {
  html {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
  
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* Reduced animation complexity on mobile */
@media (max-width: 768px) {
  .animate-fade-in,
  .animate-slide-up,
  .animate-scale-in {
    animation-duration: 200ms;
  }
}