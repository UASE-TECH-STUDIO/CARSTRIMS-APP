"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * A custom, JS-driven edge-swipe-to-navigate gesture — like iOS's
 * native edge-swipe-back, but implemented in pure React/touch events
 * so it works identically everywhere: mobile web, the Android app,
 * and the iPhone app, rather than depending on each platform's own
 * (inconsistent) native gesture support.
 *
 * Swipe in from the LEFT edge → go back.
 * Swipe in from the RIGHT edge → go forward.
 *
 * Only activates when the touch actually STARTS within a thin zone at
 * the very edge of the screen (like real edge-swipe-back), so it
 * never conflicts with a page's own horizontal swipe elsewhere — e.g.
 * the car detail page's own photo-swiping, which starts from well
 * inside the screen, not the edge.
 */

const EDGE_ZONE_PX = 24;
const COMMIT_THRESHOLD_PX = 90;

export default function EdgeSwipeNavigation({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{ startX: number; startY: number; edge: "left" | "right" | null }>({
    startX: 0, startY: 0, edge: null,
  });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      const screenW = window.innerWidth;
      let edge: "left" | "right" | null = null;
      if (x <= EDGE_ZONE_PX && window.history.length > 1) edge = "left";
      else if (x >= screenW - EDGE_ZONE_PX) edge = "right";
      gesture.current = { startX: x, startY: e.touches[0].clientY, edge };
      if (edge) setDragging(true);
    };

    const onTouchMove = (e: TouchEvent) => {
      const { startX, startY, edge } = gesture.current;
      if (!edge) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = x - startX;
      const dy = y - startY;
      // Bail out if this turns out to be a vertical scroll, not a
      // horizontal swipe — don't hijack normal page scrolling.
      if (Math.abs(dy) > Math.abs(dx) * 1.3 && Math.abs(dy) > 20) {
        gesture.current.edge = null;
        setDragging(false);
        setDragX(0);
        return;
      }
      if (edge === "left" && dx > 0) setDragX(Math.min(dx, screenClamp()));
      else if (edge === "right" && dx < 0) setDragX(Math.max(dx, -screenClamp()));
    };

    const onTouchEnd = () => {
      const { edge } = gesture.current;
      if (edge === "left" && dragX > COMMIT_THRESHOLD_PX) {
        router.back();
      } else if (edge === "right" && dragX < -COMMIT_THRESHOLD_PX) {
        router.forward();
      }
      gesture.current.edge = null;
      setDragging(false);
      setDragX(0);
    };

    const screenClamp = () => Math.min(140, window.innerWidth * 0.35);

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [dragX, router]);

  return (
    <div ref={wrapperRef} style={{ position: "relative", minHeight: "100dvh" }}>
      <div
        style={{
          transform: dragX !== 0 ? `translateX(${dragX}px)` : "none",
          transition: dragging ? "none" : "transform 0.25s ease",
          minHeight: "100dvh",
        }}
      >
        {children}
      </div>
      {/* Subtle edge shadow while dragging, giving the same "peeling
          back a page" visual cue as the native gesture. */}
      {dragging && dragX !== 0 && (
        <div
          style={{
            position: "fixed",
            top: 0,
            bottom: 0,
            [dragX > 0 ? "left" : "right"]: 0,
            width: `${Math.min(Math.abs(dragX), 40)}px`,
            background: `linear-gradient(${dragX > 0 ? "to right" : "to left"}, rgba(0,0,0,0.12), transparent)`,
            pointerEvents: "none",
            zIndex: 9998,
          } as React.CSSProperties}
        />
      )}
    </div>
  );
}
