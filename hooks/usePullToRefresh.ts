"use client";
import { useRef, useState } from "react";

/**
 * Pull-to-refresh gesture handling, extracted from the feed page so
 * every list-heavy dashboard page can use the exact same behavior
 * (damped drag feel while pulling, threshold-based release, refresh
 * spinner) without duplicating the touch-handling logic.
 *
 * Usage:
 *   const pull = usePullToRefresh(async () => { await reload(); });
 *   <div {...pull.handlers}>
 *     <PullToRefreshIndicator pullDistance={pull.pullDistance} refreshing={pull.refreshing} />
 *     ...page content...
 *   </div>
 */
export function usePullToRefresh(onRefresh: () => Promise<void> | void, threshold = 64) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0) pullStartY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - pullStartY.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPullDistance(Math.min(90, delta * 0.5));
    } else {
      pullStartY.current = null;
      setPullDistance(0);
    }
  };
  const onTouchEnd = async () => {
    if (pullStartY.current === null) return;
    const shouldRefresh = pullDistance >= threshold;
    pullStartY.current = null;
    setPullDistance(0);
    if (shouldRefresh) {
      setRefreshing(true);
      try { await onRefresh(); }
      finally { setRefreshing(false); }
    }
  };

  return {
    pullDistance,
    refreshing,
    threshold,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
