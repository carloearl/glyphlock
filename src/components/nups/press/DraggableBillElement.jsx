/**
 * DraggableBillElement — Click-and-drag to move + resize + rotate elements on the bill canvas.
 * Supports text, images, and shapes.
 */
import React, { useState, useRef, useCallback, useMemo } from "react";
import { Trash2, Move, Maximize2, RotateCw } from "lucide-react";

// ─── Barcode mini-renderer (Code 128-ish visual) ───
function MiniBarcode({ data, height = 30, fontSize = 8 }) {
  const stripes = useMemo(() => {
    if (!data) return [];
    const bars = [];
    let seed = 0;
    for (let i = 0; i < data.length; i++) seed += data.charCodeAt(i) * (i + 1);
    for (let i = 0; i < 60; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF;
      bars.push(seed % 3 === 0 ? 4 : 2);
    }
    return bars;
  }, [data]);
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="flex items-end" style={{ height: `calc(100% - ${fontSize + 2}px)` }}>
        {stripes.map((w, i) => (
          <div key={i} style={{ width: w, height: "100%", backgroundColor: i % 2 === 0 ? "#000" : "#fff" }} />
        ))}
      </div>
      <span style={{ fontSize, fontFamily: "monospace", color: "#000" }}>{data}</span>
    </div>
  );
}

// ─── QR Code mini-renderer (pattern, not scannable — placeholder) ───
function MiniQR({ data }) {
  const matrix = useMemo(() => {
    const size = 21;
    let seed = 0;
    for (let i = 0; i < (data || "").length; i++) seed += data.charCodeAt(i) * (i + 3);
    const grid = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF;
        row.push(seed % 2);
      }
      grid.push(row);
    }
    // Corner finders
    const fill = (rs, cs) => {
      for (let r = rs; r < rs + 7; r++) for (let c = cs; c < cs + 7; c++) {
        const border = r === rs || r === rs + 6 || c === cs || c === cs + 6;
        const center = r >= rs + 2 && r <= rs + 4 && c >= cs + 2 && c <= cs + 4;
        grid[r][c] = border || center ? 1 : 0;
      }
    };
    fill(0, 0); fill(0, size - 7); fill(size - 7, 0);
    return grid;
  }, [data]);
  return (
    <div className="w-full h-full bg-white p-1">
      <svg viewBox="0 0 21 21" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {matrix.map((row, r) =>
          row.map((v, c) => v ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#000" /> : null)
        )}
      </svg>
    </div>
  );
}

export default function DraggableBillElement({ element, billWidth, billHeight, onUpdate, onRemove, isInteractive }) {
  const elRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const startRef = useRef({ x: 0, y: 0, elX: 0, elY: 0, elW: 0, elH: 0 });
  const rotation = element.rotation || 0;

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const handleDragStart = useCallback((e) => {
    if (!isInteractive) return;
    e.preventDefault();
    e.stopPropagation();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startRef.current = { x: clientX, y: clientY, elX: element.x, elY: element.y, elW: element.width, elH: element.height };
    setDragging(true);

    const onMove = (ev) => {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const dx = cx - startRef.current.x;
      const dy = cy - startRef.current.y;
      const newX = clamp(startRef.current.elX + dx, 0, billWidth - element.width);
      const newY = clamp(startRef.current.elY + dy, 0, billHeight - element.height);
      onUpdate({ ...element, x: newX, y: newY });
    };

    const onUp = () => {
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
  }, [element, billWidth, billHeight, onUpdate, isInteractive]);

  const handleRotate = useCallback(() => {
    if (!isInteractive) return;
    const newRotation = (rotation + 45) % 360;
    onUpdate({ ...element, rotation: newRotation });
  }, [element, rotation, onUpdate, isInteractive]);

  const handleResizeStart = useCallback((e) => {
    if (!isInteractive) return;
    e.preventDefault();
    e.stopPropagation();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startRef.current = { x: clientX, y: clientY, elX: element.x, elY: element.y, elW: element.width, elH: element.height };
    setResizing(true);

    const onMove = (ev) => {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const dx = cx - startRef.current.x;
      const dy = cy - startRef.current.y;
      const newW = clamp(startRef.current.elW + dx, 20, billWidth - element.x);
      const newH = clamp(startRef.current.elH + dy, 20, billHeight - element.y);
      onUpdate({ ...element, width: newW, height: newH });
    };

    const onUp = () => {
      setResizing(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
  }, [element, billWidth, billHeight, onUpdate, isInteractive]);

  return (
    <div
      ref={elRef}
      className={`absolute group/el ${isInteractive ? "cursor-move" : "pointer-events-none"}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
        zIndex: dragging || resizing ? 50 : 20,
        outline: isInteractive ? "1px dashed rgba(6,182,212,0.4)" : "none",
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
    >
      {/* Content */}
      {element.type === "image" && element.src && (
        <img src={element.src} alt="" className="w-full h-full object-contain pointer-events-none" draggable={false} />
      )}
      {element.type === "text" && (
        <div
          className="w-full h-full flex items-center justify-center text-black font-bold pointer-events-none select-none"
          style={{
            fontSize: element.fontSize || Math.max(10, element.height * 0.5),
            fontFamily: element.fontFamily || "serif",
            color: element.color || "#000",
          }}
        >
          {element.content || "Text"}
        </div>
      )}
      {element.type === "denomination" && (
        <div
          className="w-full h-full flex items-center justify-center text-black font-black pointer-events-none select-none"
          style={{
            fontSize: element.fontSize || Math.max(14, element.height * 0.7),
            fontFamily: "serif",
            textShadow: "0 0 4px rgba(255,255,255,0.8)",
          }}
        >
          ${element.content || "100"}
        </div>
      )}
      {element.type === "serial" && (
        <div
          className="w-full h-full flex items-center justify-center text-black font-mono pointer-events-none select-none"
          style={{ fontSize: element.fontSize || Math.max(8, element.height * 0.4) }}
        >
          {element.content || "CC-000000"}
        </div>
      )}
      {element.type === "barcode" && (
        <MiniBarcode data={element.content || "CC-000000"} fontSize={Math.max(6, (element.height || 30) * 0.15)} />
      )}
      {element.type === "qr" && (
        <MiniQR data={element.content || "https://dream-palace.com"} />
      )}
      {element.type === "watermark" && (
        <div
          className="w-full h-full flex items-center justify-center pointer-events-none select-none"
          style={{
            fontSize: element.fontSize || Math.max(12, element.height * 0.5),
            fontFamily: "serif",
            color: "rgba(0,0,0,0.2)",
            fontWeight: "bold",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
          }}
        >
          {element.content || "CLUB CURRENCY"}
        </div>
      )}

      {/* Controls */}
      {isInteractive && (
        <>
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-cyan-500 rounded-tl cursor-se-resize opacity-0 group-hover/el:opacity-100 transition-opacity flex items-center justify-center print-hide"
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
          >
            <Maximize2 className="w-2.5 h-2.5 text-white" />
          </div>
          <button
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/el:opacity-100 transition-opacity print-hide"
            onClick={(e) => { e.stopPropagation(); onRemove(element.id); }}
          >
            <Trash2 className="w-3 h-3 text-white" />
          </button>
          <button
            className="absolute -top-2 -left-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center opacity-0 group-hover/el:opacity-100 transition-opacity print-hide"
            onClick={(e) => { e.stopPropagation(); handleRotate(); }}
          >
            <RotateCw className="w-3 h-3 text-white" />
          </button>
        </>
      )}
    </div>
  );
}