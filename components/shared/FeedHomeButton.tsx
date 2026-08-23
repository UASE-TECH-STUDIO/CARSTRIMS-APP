"use client";
import Link from "next/link";

/**
 * A persistent, always-visible button that takes the person straight
 * to the public feed/home page from anywhere in the app - every
 * dashboard (buyer, dealer, staff, partner, super-admin), the car
 * detail page, profile pages, and anywhere else it's dropped in.
 *
 * Deliberately a plain <Link>, not a router.push() button - works
 * correctly with browser back/forward and native app back-gesture
 * without any extra wiring, and doesn't need client-side JS to know
 * where "home" is.
 *
 * Redesigned to actually be self-explanatory: the previous version
 * was an icon-only button using "⌂" (a Unicode character, not a real
 * icon - ambiguous and easy to miss what it means) with no text label
 * anywhere it was used. Now uses a real house-shaped SVG icon plus a
 * visible "Home" label at all times, not hidden behind hover/tooltip.
 */
export default function FeedHomeButton({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/feed" className={`fhb ${compact ? "fhb-compact" : ""}`} title="Go to Home" aria-label="Go to Home">
      <svg className="fhb-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 11.5L12 4L21 11.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.5 9.5V19C5.5 19.5523 5.94772 20 6.5 20H9.5C10.0523 20 10.5 19.5523 10.5 19V15C10.5 14.4477 10.9477 14 11.5 14H12.5C13.0523 14 13.5 14.4477 13.5 15V19C13.5 19.5523 13.9477 20 14.5 20H17.5C18.0523 20 18.5 19.5523 18.5 19V9.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="fhb-label">Home</span>
      <style jsx>{`
        .fhb {
          display: flex; align-items: center; gap: 0.35rem;
          background: #FFF7ED; border: 1.5px solid #F47B20; color: #F47B20;
          border-radius: 8px; padding: 0.45rem 0.75rem; font-size: 0.78rem; font-weight: 700;
          text-decoration: none; white-space: nowrap; flex-shrink: 0;
          font-family: var(--font-body, inherit);
        }
        .fhb:hover { background: #F47B20; color: #fff; }
        .fhb-icon { flex-shrink: 0; }
        .fhb-compact { padding: 0.4rem 0.6rem; gap: 0.3rem; }
        .fhb-compact .fhb-label { font-size: 0.72rem; }
        @media (max-width: 360px) {
          .fhb-label { display: none; }
          .fhb { padding: 0.45rem; }
        }
      `}</style>
    </Link>
  );
}
