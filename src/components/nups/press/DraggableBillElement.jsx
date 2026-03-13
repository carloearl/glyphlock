/**
 * DraggableBillElement — Click-and-drag to move + resize + rotate elements on the bill canvas.
 * Supports text, images, and shapes.
 */
import React, { useState, useRef, useCallback } from "react";
import { Trash2, Move, Maximize2, RotateCw } from "lucide-react";

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
          style={{ fontSize: Math.max(10, element.height * 0.5), fontFamily: "serif" }}
        >
          {element.content || "Text"}
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