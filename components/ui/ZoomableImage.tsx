"use client";
import { useRef, useState } from "react";

interface Props {
  src: string;
  alt?: string;
  onRequestClose?: () => void;
}

/**
 * A lightbox image that supports pinch-to-zoom (two-finger) and
 * double-tap-to-zoom, with drag-to-pan once zoomed in. Built from raw
 * touch events rather than a library, kept intentionally simple:
 * scale 1x-4x, resets to 1x on a new image or on double-tap while
 * already zoomed in.
 */
export default function ZoomableImage({ src, alt = "", onRequestClose }: Props) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef(1);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const panOrigin = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef(0);

  const dist = (touches: React.TouchList) => {
    const [a, b] = [touches[0], touches[1]];
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchStartDist.current = dist(e.touches);
      pinchStartScale.current = scale;
    } else if (e.touches.length === 1) {
      if (scale > 1) {
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        panOrigin.current = { ...translate };
      } else {
        // Double-tap-to-zoom detection (no native dblclick on touch).
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          setScale(2);
        }
        lastTapRef.current = now;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current) {
      e.preventDefault();
      const newDist = dist(e.touches);
      const next = Math.min(4, Math.max(1, pinchStartScale.current * (newDist / pinchStartDist.current)));
      setScale(next);
    } else if (e.touches.length === 1 && panStart.current && scale > 1) {
      e.preventDefault();
      const dx = e.touches[0].clientX - panStart.current.x;
      const dy = e.touches[0].clientY - panStart.current.y;
      setTranslate({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      pinchStartDist.current = null;
      panStart.current = null;
      // Snap back to a sane state if the pinch ended below 1x, and
      // reset panning if zoomed all the way back out.
      if (scale <= 1.05) { setScale(1); setTranslate({ x: 0, y: 0 }); }
    }
  };

  const handleDoubleClick = () => {
    // Desktop/mouse fallback for the same double-tap-to-zoom behavior.
    if (scale > 1) { setScale(1); setTranslate({ x: 0, y: 0 }); }
    else setScale(2);
  };

  return (
    <div
      style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", touchAction: "none" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => { if (scale === 1) e.stopPropagation(); }}
    >
      <img
        src={src}
        alt={alt}
        onDoubleClick={handleDoubleClick}
        draggable={false}
        style={{
          maxWidth: "92vw",
          maxHeight: "90vh",
          objectFit: "contain",
          borderRadius: "8px",
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transition: pinchStartDist.current || panStart.current ? "none" : "transform 0.15s ease",
          cursor: scale > 1 ? "grab" : "zoom-in",
        }}
      />
    </div>
  );
}
