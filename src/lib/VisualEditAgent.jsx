import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

export default function VisualEditAgent() {
  const [isVisualEditMode, setIsVisualEditMode] = useState(false);

  const selectedIdRef = useRef(null);
  const hoverOverlaysRef = useRef([]);
  const selectedOverlaysRef = useRef([]);
  const rafRef = useRef(null);

  // ---------- UTIL ----------

  const isOverlay = (el) => el?.dataset?.overlay === "true";

  const createOverlay = (selected = false) => {
    const el = document.createElement("div");

    el.dataset.overlay = "true"; // 🔥 critical fix

    el.style.position = "absolute";
    el.style.pointerEvents = "none";
    el.style.zIndex = "9999";
    el.style.border = selected
      ? "2px solid #2563EB"
      : "2px solid #95a5fc";

    return el;
  };

  const getElementsById = (id) => {
    if (!id) return [];
    return [
      ...document.querySelectorAll(
        `[data-source-location="${id}"], [data-visual-selector-id="${id}"]`
      ),
    ];
  };

  const clearOverlays = (type = "all") => {
    const remove = (arr) => {
      arr.forEach((o) => o?.remove());
      return [];
    };

    if (type === "hover" || type === "all") {
      hoverOverlaysRef.current = remove(hoverOverlaysRef.current);
    }

    if (type === "selected" || type === "all") {
      selectedOverlaysRef.current = remove(selectedOverlaysRef.current);
    }
  };

  const positionOverlay = (overlay, element) => {
    const rect = element.getBoundingClientRect();

    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
  };

  // ---------- RENDER LOOP (CONTROLLED) ----------

  const scheduleUpdate = () => {
    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;

      // update selected overlays
      if (selectedIdRef.current) {
        const els = getElementsById(selectedIdRef.current);

        selectedOverlaysRef.current.forEach((overlay, i) => {
          if (els[i]) positionOverlay(overlay, els[i]);
        });
      }
    });
  };

  // ---------- EVENTS ----------

  const handleHover = (e) => {
    if (!isVisualEditMode) return;

    const target = e.target.closest(
      "[data-source-location], [data-visual-selector-id]"
    );

    if (!target || isOverlay(target)) {
      clearOverlays("hover");
      return;
    }

    const id =
      target.dataset.sourceLocation ||
      target.dataset.visualSelectorId;

    if (id === selectedIdRef.current) return;

    clearOverlays("hover");

    const els = getElementsById(id);

    els.forEach((el) => {
      const overlay = createOverlay(false);
      document.body.appendChild(overlay);
      positionOverlay(overlay, el);
      hoverOverlaysRef.current.push(overlay);
    });
  };

  const handleClick = (e) => {
    if (!isVisualEditMode) return;

    const target = e.target.closest(
      "[data-source-location], [data-visual-selector-id]"
    );

    if (!target || isOverlay(target)) return;

    e.preventDefault();
    e.stopPropagation();

    const id =
      target.dataset.sourceLocation ||
      target.dataset.visualSelectorId;

    selectedIdRef.current = id;

    clearOverlays("all");

    const els = getElementsById(id);

    els.forEach((el) => {
      const overlay = createOverlay(true);
      document.body.appendChild(overlay);
      positionOverlay(overlay, el);
      selectedOverlaysRef.current.push(overlay);
    });

    window.parent.postMessage(
      {
        type: "element-selected",
        id,
        classes: target.className,
        content: target.innerText,
      },
      "*"
    );
  };

  // ---------- CLASS UPDATE ----------

  const updateClasses = (id, classes) => {
    const els = getElementsById(id);

    els.forEach((el) => {
      const current = el.className || "";
      el.className = twMerge(current, classes);
    });

    scheduleUpdate(); // 🔥 controlled update
  };

  // ---------- MESSAGE LISTENER ----------

  useEffect(() => {
    const handleMessage = (e) => {
      const msg = e.data;

      if (msg?.type === "toggle") {
        setIsVisualEditMode(msg.enabled);
      }

      if (msg?.type === "update-classes") {
        updateClasses(msg.id, msg.classes);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // ---------- LIFECYCLE ----------

  useEffect(() => {
    if (!isVisualEditMode) {
      clearOverlays("all");
      document.body.style.cursor = "default";
      return;
    }

    document.body.style.cursor = "crosshair";

    document.addEventListener("mouseover", handleHover);
    document.addEventListener("click", handleClick, true);
    window.addEventListener("scroll", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      document.removeEventListener("mouseover", handleHover);
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);

      clearOverlays("all");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisualEditMode]);

  return null;
}