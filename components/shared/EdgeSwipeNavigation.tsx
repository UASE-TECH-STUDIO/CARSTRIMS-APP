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
 *
 * IMPORTANT: this version does NOT wrap children in a transform-
 * capable div. An earlier version did, to show a live drag-follow
 * animation while swiping — but wrapping the ENTIRE app in an element
 * that can take a CSS transform is a known category of conflict with
 * how Android's WebView renders NATIVE <select> dropdown pickers,
 * and was very likely the cause of a white-screen crash appearing on
 * every dropdown interaction across the app, including registration.
 * The visual drag animation is a nice-to-have; a broken registration
 * flow is not an acceptable trade-off for it, so it's gone. The
 * actual swipe-to-navigate behavior (detecting the gesture and
 * calling router.back()/forward()) is unaffected — only the visual
 * follow-the-finger effect during the drag is removed.
 */

const EDGE_ZONE_PX = 24;
const COMMIT_THRESHOLD_PX = 90;

export default function EdgeSwipeNavigation({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const gesture = useRef<{ startX: number; startY: number; edge: "left" | "right" | null; dragX: number }>({
    startX: 0, startY: 0, edge: null, dragX: 0,
  });

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      const screenW = window.innerWidth;
      let edge: "left" | "right" | null = null;
      if (x <= EDGE_ZONE_PX && window.history.length > 1) edge = "left";
      else if (x >= screenW - EDGE_ZONE_PX) edge = "right";
      gesture.current = { startX: x, startY: e.touches[0].clientY, edge, dragX: 0 };
    };

    const onTouchMove = (e: TouchEvent) => {
      const g = gesture.current;
      if (!g.edge) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = x - g.startX;
      const dy = y - g.startY;
      // Bail out if this turns out to be a vertical scroll, not a
      // horizontal swipe — don't hijack normal page scrolling.
      if (Math.abs(dy) > Math.abs(dx) * 1.3 && Math.abs(dy) > 20) {
        gesture.current.edge = null;
        return;
      }
      gesture.current.dragX = dx;
    };

    const onTouchEnd = () => {
      const { edge, dragX } = gesture.current;
      if (edge === "left" && dragX > COMMIT_THRESHOLD_PX) {
        router.back();
      } else if (edge === "right" && dragX < -COMMIT_THRESHOLD_PX) {
        router.forward();
      }
      gesture.current = { startX: 0, startY: 0, edge: null, dragX: 0 };
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [router]);

  return <>{children}</>;
}
