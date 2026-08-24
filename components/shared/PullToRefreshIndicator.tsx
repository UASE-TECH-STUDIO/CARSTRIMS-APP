"use client";

/**
 * Visual spinner for the pull-to-refresh gesture (see
 * hooks/usePullToRefresh.ts) - same look as the feed page's original,
 * self-contained here so any page can drop it in without duplicating
 * the CSS.
 */
export default function PullToRefreshIndicator({
  pullDistance, refreshing, threshold = 64,
}: { pullDistance: number; refreshing: boolean; threshold?: number }) {
  if (pullDistance <= 0 && !refreshing) return null;
  return (
    <>
      <div className="ptr-indicator" style={{ height: refreshing ? 48 : pullDistance }}>
        <div className={`ptr-spinner ${refreshing || pullDistance >= threshold ? "ptr-spinner-ready" : ""}`} />
      </div>
      <style jsx>{`
        .ptr-indicator {
          display: flex; align-items: center; justify-content: center; overflow: hidden;
          transition: height 0.2s ease; background: #FAFAFA;
        }
        .ptr-spinner {
          width: 24px; height: 24px; border: 2.5px solid #E5E5E5; border-top-color: #A3A3A3;
          border-radius: 50%; animation: ptr-spin 0.8s linear infinite; transition: border-top-color 0.2s;
        }
        .ptr-spinner-ready { border-top-color: #F47B20; }
        @keyframes ptr-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
