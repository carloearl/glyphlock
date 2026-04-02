import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Volume2, VolumeX } from "lucide-react";

const NUPS_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>N.U.P.S. — Next Universal Platform System</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #000;
      color: #fff;
      overflow: hidden;
    }
    canvas { display: block; }
    .container {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    .content {
      text-align: center;
      z-index: 20;
      pointer-events: auto;
    }
    h1 {
      font-size: clamp(2rem, 8vw, 5rem);
      font-weight: 900;
      letter-spacing: -2px;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #00E4FF, #3B82F6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle {
      font-size: clamp(1rem, 3vw, 1.5rem);
      color: #a5c0ff;
      margin-bottom: 3rem;
      font-weight: 500;
    }
    .cta-button {
      padding: 16px 48px;
      font-size: 1.1rem;
      font-weight: 700;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #00E4FF, #3B82F6);
      color: #000;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 0 30px rgba(0, 228, 255, 0.5);
    }
    .cta-button:hover {
      transform: scale(1.05);
      box-shadow: 0 0 50px rgba(0, 228, 255, 0.8);
    }
    .cta-button:active {
      transform: scale(0.98);
    }
    .controls {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 30;
      display: flex;
      gap: 8px;
    }
    .control-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(0, 228, 255, 0.1);
      border: 2px solid rgba(0, 228, 255, 0.3);
      color: #00E4FF;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 20px;
    }
    .control-btn:hover {
      background: rgba(0, 228, 255, 0.2);
      border-color: rgba(0, 228, 255, 0.6);
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div class="container">
    <div class="content">
      <h1>N.U.P.S.</h1>
      <div class="subtitle">Next Universal Platform System</div>
      <button class="cta-button" id="enterBtn">Enter System</button>
    </div>
  </div>
  <div class="controls">
    <button class="control-btn" id="soundToggle" title="Toggle Sound">🔊</button>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script>
    let scene, camera, renderer, particles;
    let soundEnabled = true;

    function init() {
      // Scene
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 50;

      renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 1);

      // Particles
      const geometry = new THREE.BufferGeometry();
      const particleCount = 500;
      const positions = new Float32Array(particleCount * 3);
      const velocities = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 200;
        positions[i + 1] = (Math.random() - 0.5) * 200;
        positions[i + 2] = (Math.random() - 0.5) * 200;

        velocities[i] = (Math.random() - 0.5) * 0.5;
        velocities[i + 1] = (Math.random() - 0.5) * 0.5;
        velocities[i + 2] = (Math.random() - 0.5) * 0.5;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({ color: 0x00E4FF, size: 0.5 });
      particles = new THREE.Points(geometry, material);
      scene.add(particles);

      window.addEventListener('resize', onWindowResize);
      animate();
    }

    function animate() {
      requestAnimationFrame(animate);

      const positions = particles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        if (Math.abs(positions[i]) > 100) velocities[i] *= -1;
        if (Math.abs(positions[i + 1]) > 100) velocities[i + 1] *= -1;
        if (Math.abs(positions[i + 2]) > 100) velocities[i + 2] *= -1;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.x += 0.0001;
      particles.rotation.y += 0.0002;

      renderer.render(scene, camera);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    document.getElementById('enterBtn').addEventListener('click', () => {
      window.parent.postMessage({ type: 'NUPS_ENTER' }, '*');
    });

    document.getElementById('soundToggle').addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      document.getElementById('soundToggle').textContent = soundEnabled ? '🔊' : '🔇';
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        window.parent.postMessage({ type: 'NUPS_ENTER' }, '*');
      }
    });

    init();
  </script>
</body>
</html>
`;

export default function NUPSLanding() {
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'NUPS_ENTER') {
        navigate('/NUPSGateway');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  useEffect(() => {
    const handleEnter = (e) => {
      if (e.key === 'Enter') {
        navigate('/NUPSGateway');
      }
    };
    window.addEventListener('keydown', handleEnter);
    return () => window.removeEventListener('keydown', handleEnter);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-black">
      <iframe
        ref={iframeRef}
        srcDoc={NUPS_HTML}
        className="w-full h-full border-none"
        title="NUPS Landing"
      />
    </div>
  );
}