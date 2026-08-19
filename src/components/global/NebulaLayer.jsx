/**
 * GlyphLock Nebula Layer - Site-Wide Background System
 * Renders behind all cards/content
 * z-index: 0-1 (starfield + animated layer)
 *
 * Performance: on touch / tablet / low-core devices the node count, link work
 * and frame rate are all reduced so the ambient layer never dominates the
 * main thread while the page is still loading.
 */

import React, { useEffect, useRef } from 'react';

function detectLowPower() {
  if (typeof window === 'undefined') return true;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
  const smallViewport = window.innerWidth < 1280;
  const fewCores = (navigator.hardwareConcurrency || 8) < 8;
  return Boolean(coarsePointer || smallViewport || fewCores);
}

export default function NebulaLayer({ intensity = 0.5 }) {
  const canvasRef = useRef(null);
  const starsCanvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const starsCanvas = starsCanvasRef.current;
    if (!canvas || !starsCanvas) return;

    const lowPower = detectLowPower();
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    const starsCtx = starsCanvas.getContext('2d', { alpha: true });

    const nodeCount = lowPower ? 32 : 100;
    const linkDistance = lowPower ? 110 : 160;
    const frameInterval = lowPower ? 1000 / 30 : 0;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let time = 0;
    let lastFrame = 0;
    let paused = false;
    let nodes = [];

    class NebulaNode {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseX = this.x;
        this.baseY = this.y;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.radius = Math.random() * 1.8 + 0.8;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.02 + Math.random() * 0.02;

        const colorIndex = Math.random();
        if (colorIndex > 0.7) {
          this.color = 'rgba(139, 0, 255, ';
        } else if (colorIndex > 0.4) {
          this.color = 'rgba(0, 191, 255, ';
        } else {
          this.color = 'rgba(178, 123, 255, ';
        }
      }

      update() {
        this.baseX += this.vx;
        this.baseY += this.vy;

        if (this.baseX < -50) this.baseX = canvas.width + 50;
        if (this.baseX > canvas.width + 50) this.baseX = -50;
        if (this.baseY < -50) this.baseY = canvas.height + 50;
        if (this.baseY > canvas.height + 50) this.baseY = -50;

        if (lowPower) {
          this.x = this.baseX;
          this.y = this.baseY;
        } else {
          const dx = mouseX - this.baseX;
          const dy = mouseY - this.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 400) {
            const force = (400 - dist) / 400;
            const smoothForce = force * force * 0.8;
            this.x += (this.baseX + dx * smoothForce - this.x) * 0.25;
            this.y += (this.baseY + dy * smoothForce - this.y) * 0.25;
          } else {
            this.x += (this.baseX - this.x) * 0.08;
            this.y += (this.baseY - this.y) * 0.08;
          }
        }

        this.pulse += this.pulseSpeed;
      }

      draw() {
        const pulseIntensity = Math.sin(this.pulse) * 0.4 + 0.6;
        const currentRadius = this.radius * pulseIntensity;

        if (!lowPower) {
          const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, currentRadius * 4
          );
          glowGradient.addColorStop(0, this.color + (0.9 * intensity) + ')');
          glowGradient.addColorStop(0.4, this.color + (0.6 * intensity) + ')');
          glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(this.x, this.y, currentRadius * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = this.color + (1.0 * intensity) + ')';
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function initNodes() {
      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push(new NebulaNode());
      }
    }

    function renderStarfield() {
      starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
      const starCount = lowPower ? 110 : 250;

      for (let i = 0; i < starCount; i++) {
        const x = Math.random() * starsCanvas.width;
        const y = Math.random() * starsCanvas.height;
        const radius = Math.random() * 1.2;
        const opacity = Math.random() * 0.4 + 0.1;

        starsCtx.fillStyle = `rgba(255, 255, 255, ${opacity * intensity * 1.5})`;
        starsCtx.beginPath();
        starsCtx.arc(x, y, radius, 0, Math.PI * 2);
        starsCtx.fill();
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      starsCanvas.width = window.innerWidth;
      starsCanvas.height = window.innerHeight;

      initNodes();
      renderStarfield();
    };

    const handlePointerMove = (e) => {
      if (e.clientX !== undefined) {
        mouseX = e.clientX;
        mouseY = e.clientY;
      }
    };

    function drawNebulaClouds() {
      const nebula1 = ctx.createRadialGradient(
        canvas.width * 0.25 + Math.sin(time * 0.5) * 100,
        canvas.height * 0.3 + Math.cos(time * 0.3) * 80,
        0,
        canvas.width * 0.25,
        canvas.height * 0.3,
        canvas.width * 0.6
      );
      nebula1.addColorStop(0, `rgba(59, 130, 246, ${0.12 * intensity})`);
      nebula1.addColorStop(0.4, `rgba(30, 64, 175, ${0.08 * intensity})`);
      nebula1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const nebula2 = ctx.createRadialGradient(
        canvas.width * 0.75 + Math.cos(time * 0.4) * 120,
        canvas.height * 0.65 + Math.sin(time * 0.6) * 90,
        0,
        canvas.width * 0.75,
        canvas.height * 0.65,
        canvas.width * 0.5
      );
      nebula2.addColorStop(0, `rgba(140, 75, 255, ${0.1 * intensity})`);
      nebula2.addColorStop(0.5, `rgba(59, 130, 246, ${0.08 * intensity})`);
      nebula2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawLinks() {
      // Low power: one flat stroke style for every link (no per-link gradients).
      if (lowPower) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(120, 140, 255, ${0.22 * intensity})`;
        ctx.beginPath();
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            if (dx * dx + dy * dy > linkDistance * linkDistance) continue;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
          }
        }
        ctx.stroke();
        return;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < linkDistance) {
            const opacity = (1 - distance / linkDistance) * 0.4 * intensity;
            const gradient = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            gradient.addColorStop(0, `rgba(139, 0, 255, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(0, 191, 255, ${opacity * 0.9})`);
            gradient.addColorStop(1, `rgba(178, 123, 255, ${opacity})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }

        const dxOrb = nodes[i].x - mouseX;
        const dyOrb = nodes[i].y - mouseY;
        const distanceToOrb = Math.sqrt(dxOrb * dxOrb + dyOrb * dyOrb);

        if (distanceToOrb < 300) {
          const orbOpacity = (1 - distanceToOrb / 300) * 0.6 * intensity;
          const orbGradient = ctx.createLinearGradient(nodes[i].x, nodes[i].y, mouseX, mouseY);
          orbGradient.addColorStop(0, `rgba(139, 0, 255, ${orbOpacity * 0.4})`);
          orbGradient.addColorStop(0.5, `rgba(168, 85, 247, ${orbOpacity * 0.7})`);
          orbGradient.addColorStop(1, `rgba(56, 189, 248, ${orbOpacity})`);

          ctx.strokeStyle = orbGradient;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(mouseX, mouseY);
          ctx.stroke();
        }
      }
    }

    function renderFrame() {
      time += 0.005;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawNebulaClouds();

      nodes.forEach((node) => {
        node.update();
        node.draw();
      });

      drawLinks();
    }

    function animate(now) {
      animationRef.current = requestAnimationFrame(animate);
      if (paused) return;
      if (frameInterval && now - lastFrame < frameInterval) return;
      lastFrame = now || 0;
      renderFrame();
    }

    const handleVisibility = () => {
      paused = document.hidden;
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibility);
    if (!lowPower) {
      window.addEventListener('mousemove', handlePointerMove, { passive: true });
    }

    if (reduceMotion) {
      renderFrame();
    } else {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [intensity]);

  return (
    <>
      <canvas
        ref={starsCanvasRef}
        id="nebula-layer-stars"
        className="fixed inset-0 nebula-layer-container"
        style={{
          zIndex: 0,
          mixBlendMode: 'screen',
          opacity: 0.82,
          pointerEvents: 'none',
          touchAction: 'none',
          userSelect: 'none',
          transform: 'translateZ(0)',
        }}
      />

      <canvas
        ref={canvasRef}
        id="nebula-layer"
        className="fixed inset-0 nebula-layer-container"
        style={{
          zIndex: 1,
          mixBlendMode: 'screen',
          opacity: 0.92,
          pointerEvents: 'none',
          touchAction: 'none',
          userSelect: 'none',
          transform: 'translateZ(0)',
        }}
      />
    </>
  );
}