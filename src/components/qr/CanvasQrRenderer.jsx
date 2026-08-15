import React, { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';

/**
 * CanvasQrRenderer - Custom Canvas-based QR code renderer
 * Supports 12 dot styles including Heart, all eye styles, gradients, and logo overlay
 * NO external API dependency - all rendering happens locally
 */
export default function CanvasQrRenderer({
  text = 'https://glyphlock.io',
  size = 300,
  errorCorrectionLevel = 'H',
  customization = {},
  onDataUrlReady = null,
  className = '',
  showDownload = false
}) {
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState(null);
  const [isRendering, setIsRendering] = useState(false);

  // Extract customization with defaults - PURE WHITE background by default
  const {
    dotStyle = 'square',
    eyeStyle = 'square',
    foregroundColor = '#000000',
    backgroundColor = '#ffffff',
    gradient = {},
    eyeColors = {},
    logo = {},
    background = { type: 'solid', color: '#ffffff' },
    qrShape = {}
  } = customization;

  // Get actual background color - ensure pure white default
  const getBackgroundColor = useCallback(() => {
    if (background?.type === 'solid') {
      return background?.color || '#ffffff';
    }
    return '#ffffff';
  }, [background]);

  // Draw different dot shapes
  const drawDotShape = useCallback((ctx, x, y, cellSize, style, color) => {
    const padding = cellSize * 0.1;
    const size = cellSize - padding * 2;
    const cx = x + cellSize / 2;
    const cy = y + cellSize / 2;
    const radius = size / 2;

    ctx.fillStyle = color;
    ctx.beginPath();

    switch (style) {
      case 'circle':
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'rounded': {
        const cornerRadius = size * 0.3;
        ctx.roundRect(x + padding, y + padding, size, size, cornerRadius);
        ctx.fill();
        break;

      }
      case 'diamond':
        ctx.moveTo(cx, y + padding);
        ctx.lineTo(x + cellSize - padding, cy);
        ctx.lineTo(cx, y + cellSize - padding);
        ctx.lineTo(x + padding, cy);
        ctx.closePath();
        ctx.fill();
        break;

      case 'star':
        drawStar(ctx, cx, cy, 5, radius, radius * 0.5);
        ctx.fill();
        break;

      case 'heart':
        drawHeart(ctx, cx, cy, radius * 0.9);
        ctx.fill();
        break;

      case 'hex':
      case 'hexagon':
        drawHexagon(ctx, cx, cy, radius);
        ctx.fill();
        break;

      case 'pixel':
        // Slightly smaller square with gaps
        const pixelPadding = cellSize * 0.15;
        ctx.fillRect(x + pixelPadding, y + pixelPadding, cellSize - pixelPadding * 2, cellSize - pixelPadding * 2);
        break;

      case 'mosaic':
        // Multiple small tiles
        const tileSize = size / 2;
        const gap = 1;
        ctx.fillRect(x + padding, y + padding, tileSize - gap, tileSize - gap);
        ctx.fillRect(x + padding + tileSize, y + padding, tileSize - gap, tileSize - gap);
        ctx.fillRect(x + padding, y + padding + tileSize, tileSize - gap, tileSize - gap);
        ctx.fillRect(x + padding + tileSize, y + padding + tileSize, tileSize - gap, tileSize - gap);
        break;

      case 'microdots':
        // Smaller centered dot
        ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'bevel':
        // Square with inner highlight effect
        ctx.fillRect(x + padding, y + padding, size, size);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(x + padding, y + padding, size * 0.3, size);
        ctx.fillRect(x + padding, y + padding, size, size * 0.3);
        break;

      case 'liquid':
        // Organic blob shape
        ctx.arc(cx, cy, radius * 0.95, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'square':
      default:
        ctx.fillRect(x + padding, y + padding, size, size);
        break;
    }
  }, []);

  // Draw 5-pointed star
  const drawStar = (ctx, cx, cy, points, outerRadius, innerRadius) => {
    const angle = Math.PI / points;
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const a = angle * i - Math.PI / 2;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
  };

  // Draw heart shape
  const drawHeart = (ctx, cx, cy, size) => {
    const width = size * 2;
    const height = size * 1.8;
    const topCurveHeight = height * 0.3;
    
    ctx.moveTo(cx, cy + height * 0.35);
    
    // Left curve
    ctx.bezierCurveTo(
      cx - width / 2, cy - topCurveHeight,
      cx - width / 2, cy - height * 0.5,
      cx, cy - height * 0.15
    );
    
    // Right curve
    ctx.bezierCurveTo(
      cx + width / 2, cy - height * 0.5,
      cx + width / 2, cy - topCurveHeight,
      cx, cy + height * 0.35
    );
    
    ctx.closePath();
  };

  // Draw hexagon
  const drawHexagon = (ctx, cx, cy, radius) => {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };

  // Draw finder pattern (eye)
  const drawFinderPattern = useCallback((ctx, x, y, cellSize, count, eyeStyle, innerColor, outerColor) => {
    const totalSize = cellSize * count;
    
    // Outer square/shape
    ctx.fillStyle = outerColor;
    ctx.beginPath();
    
    switch (eyeStyle) {
      case 'circular':
      case 'rounded':
        ctx.arc(x + totalSize / 2, y + totalSize / 2, totalSize / 2, 0, Math.PI * 2);
        break;
      case 'diamond': {
        const cx = x + totalSize / 2;
        const cy = y + totalSize / 2;
        ctx.moveTo(cx, y);
        ctx.lineTo(x + totalSize, cy);
        ctx.lineTo(cx, y + totalSize);
        ctx.lineTo(x, cy);
        ctx.closePath();
        break;
      }
      default:
        ctx.rect(x, y, totalSize, totalSize);
    }
    ctx.fill();
    
    // White ring
    const ringSize = cellSize * (count - 2);
    const ringOffset = cellSize;
    ctx.fillStyle = getBackgroundColor();
    ctx.beginPath();
    
    switch (eyeStyle) {
      case 'circular':
      case 'rounded':
        ctx.arc(x + totalSize / 2, y + totalSize / 2, ringSize / 2 + cellSize * 0.5, 0, Math.PI * 2);
        break;
      default:
        ctx.rect(x + ringOffset, y + ringOffset, ringSize, ringSize);
    }
    ctx.fill();
    
    // Inner square/dot
    const innerSize = cellSize * (count - 4);
    const innerOffset = cellSize * 2;
    ctx.fillStyle = innerColor;
    ctx.beginPath();
    
    switch (eyeStyle) {
      case 'circular':
      case 'rounded':
        ctx.arc(x + totalSize / 2, y + totalSize / 2, innerSize / 2 + cellSize * 0.3, 0, Math.PI * 2);
        break;
      default:
        ctx.rect(x + innerOffset, y + innerOffset, innerSize, innerSize);
    }
    ctx.fill();
  }, [getBackgroundColor]);

  // Check if position is part of finder pattern
  const isFinderPattern = useCallback((row, col, size) => {
    // Top-left
    if (row < 7 && col < 7) return true;
    // Top-right
    if (row < 7 && col >= size - 7) return true;
    // Bottom-left
    if (row >= size - 7 && col < 7) return true;
    return false;
  }, []);

  // Create gradient if enabled
  const createGradient = useCallback((ctx, width, height) => {
    if (!gradient?.enabled) return foregroundColor;
    
    let grad;
    const colors = [
      gradient.color1 || '#000000',
      gradient.color2 || '#3B82F6',
      gradient.color3 || '#8B5CF6',
      gradient.color4,
      gradient.color5
    ].filter(Boolean);
    
    if (gradient.type === 'radial') {
      grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    } else {
      const angle = (gradient.angle || 0) * Math.PI / 180;
      const x1 = width / 2 - Math.cos(angle) * width / 2;
      const y1 = height / 2 - Math.sin(angle) * height / 2;
      const x2 = width / 2 + Math.cos(angle) * width / 2;
      const y2 = height / 2 + Math.sin(angle) * height / 2;
      grad = ctx.createLinearGradient(x1, y1, x2, y2);
    }
    
    colors.forEach((color, i) => {
      grad.addColorStop(i / (colors.length - 1), color);
    });
    
    return grad;
  }, [gradient, foregroundColor]);

  // Main render function
  const renderQR = useCallback(async () => {
    if (!canvasRef.current || !text) return;
    
    setIsRendering(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    try {
      // Generate QR matrix
      const qrData = await QRCode.create(text, {
        errorCorrectionLevel: errorCorrectionLevel
      });
      
      const modules = qrData.modules;
      const moduleCount = modules.size;
      
      // Calculate cell size
      const margin = qrShape?.margin === 'none' ? 0 
        : qrShape?.margin === 'small' ? 10 
        : qrShape?.margin === 'large' ? 40 
        : 20;
      
      const availableSize = size - margin * 2;
      const cellSize = availableSize / moduleCount;
      
      // Set canvas size
      canvas.width = size;
      canvas.height = size;
      
      // Clear and fill background - ALWAYS start with pure white or specified color
      const bgColor = getBackgroundColor();
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);
      
      // Background gradient if enabled
      if (background?.type === 'gradient') {
        const bgGrad = ctx.createLinearGradient(0, 0, size, size);
        bgGrad.addColorStop(0, background.gradientColor1 || '#ffffff');
        bgGrad.addColorStop(1, background.gradientColor2 || '#e5e7eb');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, size, size);
      }
      
      // Create foreground gradient/color
      const fgColor = createGradient(ctx, size, size);
      
      // Draw QR modules
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (modules.get(row, col)) {
            // Skip finder pattern areas - we'll draw them separately
            if (isFinderPattern(row, col, moduleCount)) continue;
            
            const x = margin + col * cellSize;
            const y = margin + row * cellSize;
            
            drawDotShape(ctx, x, y, cellSize, dotStyle, fgColor);
          }
        }
      }
      
      // Draw finder patterns with custom eye colors
      const eyePositions = [
        { row: 0, col: 0, key: 'topLeft' },
        { row: 0, col: moduleCount - 7, key: 'topRight' },
        { row: moduleCount - 7, col: 0, key: 'bottomLeft' }
      ];
      
      eyePositions.forEach(({ row, col, key }) => {
        const x = margin + col * cellSize;
        const y = margin + row * cellSize;
        const inner = eyeColors?.[key]?.inner || foregroundColor;
        const outer = eyeColors?.[key]?.outer || foregroundColor;
        drawFinderPattern(ctx, x, y, cellSize, 7, eyeStyle, inner, outer);
      });
      
      // Draw logo if present
      if (logo?.url) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
          const logoSize = (size * (logo.size || 20)) / 100;
          const logoX = (size - logoSize) / 2;
          const logoY = (size - logoSize) / 2;
          
          // White background for logo
          ctx.fillStyle = '#ffffff';
          const padding = 5;
          
          if (logo.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, logoSize / 2 + padding, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const borderRadius = logo.shape === 'rounded' ? 10 : 0;
            ctx.beginPath();
            ctx.roundRect(logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2, borderRadius);
            ctx.fill();
          }
          
          // Draw logo
          ctx.save();
          if (logo.rotation) {
            ctx.translate(size / 2, size / 2);
            ctx.rotate((logo.rotation * Math.PI) / 180);
            ctx.translate(-size / 2, -size / 2);
          }
          
          ctx.globalAlpha = (logo.opacity || 100) / 100;
          
          if (logo.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, logoSize / 2, 0, Math.PI * 2);
            ctx.clip();
          }
          
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          ctx.restore();
          
          // Update data URL after logo
          updateDataUrl();
        };
        logoImg.src = logo.url;
      } else {
        updateDataUrl();
      }
      
    } catch (err) {
      console.error('QR render error:', err);
    } finally {
      setIsRendering(false);
    }
  }, [text, size, errorCorrectionLevel, dotStyle, eyeStyle, foregroundColor, gradient, eyeColors, logo, background, qrShape, drawDotShape, drawFinderPattern, isFinderPattern, createGradient, getBackgroundColor]);

  const updateDataUrl = useCallback(() => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    setDataUrl(url);
    if (onDataUrlReady) {
      onDataUrlReady(url);
    }
  }, [onDataUrlReady]);

  // Render on changes
  useEffect(() => {
    renderQR();
  }, [renderQR]);

  // Download handlers
  const downloadPNG = useCallback(() => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = dataUrl;
    link.click();
  }, [dataUrl]);

  const downloadSVG = useCallback(() => {
    // Note: Canvas renderer doesn't natively support SVG
    // For SVG, use the StyledQRRenderer with qr-code-styling
    downloadPNG();
  }, [downloadPNG]);

  return (
    <div className={`canvas-qr-renderer ${className}`}>
      <canvas
        ref={canvasRef}
        className="mx-auto"
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          borderRadius: qrShape?.cornerRadius ? `${qrShape.cornerRadius}%` : '0'
        }}
      />
      
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {showDownload && dataUrl && (
        <div className="flex gap-2 mt-4 justify-center">
          <button
            onClick={downloadPNG}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Download PNG
          </button>
        </div>
      )}
    </div>
  );
}

// Utility function for external use
export const generateQRDataUrl = async (text, size, customization) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Simple generation for utility
    QRCode.toCanvas(canvas, text, {
      width: size,
      margin: 2,
      color: {
        dark: customization?.foregroundColor || '#000000',
        light: customization?.backgroundColor || '#ffffff'
      },
      errorCorrectionLevel: 'H'
    }).then(() => {
      resolve(canvas.toDataURL('image/png'));
    }).catch(reject);
  });
};