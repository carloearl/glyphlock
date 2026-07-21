/**
 * DraggableBillElement — Click-and-drag to move + resize + rotate elements on the bill canvas.
 * Supports text, images, and shapes.
 */
import React, { useState, useRef, useCallback } from "react";
import { Trash2, Maximize2, RotateCw } from "lucide-react";
import Code128 from "@/components/nups/glyphbucks/Code128";
import RealQR from "@/components/nups/glyphbucks/RealQR";

export default function DraggableBillElement({ element, billWidth, billHeight, onUpdate, onRemove, isInteractive }) {
  const elRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const startRef = useRef({ x: 0, y: 0, elX: 0, elY: 0, elW: 0, elH: 0 });
  const rotation = element.rotation || 0;

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const handleDragStart = useCallback((e) => {
    if (!isInteractive) return;
    // Pointer Events unify mouse + touch + pen, so a single code path drives
    // dragging on desktop AND tablet (fixes mouse-only-broken bug).
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget;
    try { target.setPointerCapture?.(e.pointerId); } catch { /* noop */ }
    startRef.current = { x: e.clientX, y: e.clientY, elX: element.x, elY: element.y, elW: element.width, elH: element.height };
    setDragging(true);

    const onMove = (ev) => {
      const dx = ev.clientX - startRef.current.x;
      const dy = ev.clientY - startRef.current.y;
      const newX = clamp(startRef.current.elX + dx, 0, billWidth - element.width);
      const newY = clamp(startRef.current.elY + dy, 0, billHeight - element.height);
      onUpdate({ ...element, x: newX, y: newY });
    };

    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
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
    const target = e.currentTarget;
    try { target.setPointerCapture?.(e.pointerId); } catch { /* noop */ }
    startRef.current = { x: e.clientX, y: e.clientY, elX: element.x, elY: element.y, elW: element.width, elH: element.height };
    setResizing(true);

    const onMove = (ev) => {
      const dx = ev.clientX - startRef.current.x;
      const dy = ev.clientY - startRef.current.y;
      const newW = clamp(startRef.current.elW + dx, 20, billWidth - element.x);
      const newH = clamp(startRef.current.elH + dy, 20, billHeight - element.y);
      onUpdate({ ...element, width: newW, height: newH });
    };

    const onUp = () => {
      setResizing(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
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
        touchAction: isInteractive ? "none" : "auto",
      }}
      onPointerDown={handleDragStart}
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
        <div className="w-full h-full flex items-center justify-center bg-white pointer-events-none">
          <Code128 value={element.content || "000000000000"} height={Math.max(20, (element.height || 30) * 0.7)} barWidth={1} displayValue style={{ maxWidth: "100%", maxHeight: "100%" }} />
        </div>
      )}
      {element.type === "qr" && (
        <div className="w-full h-full flex items-center justify-center bg-white p-1 pointer-events-none">
          <RealQR value={element.content || "https://dream-palace.com"} size={Math.max(48, Math.min(element.width, element.height))} style={{ maxWidth: "100%", maxHeight: "100%" }} />
        </div>
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
            style={{ touchAction: "none" }}
            onPointerDown={handleResizeStart}
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