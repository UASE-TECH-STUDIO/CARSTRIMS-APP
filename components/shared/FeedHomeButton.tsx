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
 * Icon-only again, but not the old ambiguous version: that one used
 * "⌂" (a Unicode character, not a real icon) with no label at all,
 * which is why a text label got added. That label is now removed
 * again for a different, real reason - it started visually clashing
 * with the Sign Out button and other topbar text once Sign Out was
 * added next to it on every dashboard. Kept the real house-shaped
 * SVG icon from that redesign (not reverting to the ambiguous
 * Unicode glyph), just sized up and given a filled background so
 * it's still immediately recognizable without needing the word
 * "Home" written next to it.
 */
export default function FeedHomeButton({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/feed" className={`fhb ${compact ? "fhb-compact" : ""}`} title="Go to Home" aria-label="Go to Home">
      <svg className="fhb-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 11.5L12 4L21 11.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.5 9.5V19C5.5 19.5523 5.94772 20 6.5 20H9.5C10.0523 20 10.5 19.5523 10.5 19V15C10.5 14.4477 10.9477 14 11.5 14H12.5C13.0523 14 13.5 14.4477 13.5 15V19C13.5 19.5523 13.9477 20 14.5 20H17.5C18.0523 20 18.5 19.5523 18.5 19V9.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <style jsx>{`
        .fhb {
          display: flex; align-items: center; justify-content: center;
          background: #FFF7ED; border: 1.5px solid #F47B20; color: #F47B20;
          border-radius: 8px; width: 38px; height: 38px; flex-shrink: 0;
        }
        .fhb:hover { background: #F47B20; color: #fff; }
        .fhb-icon { flex-shrink: 0; }
        .fhb-compact { width: 34px; height: 34px; }
        .fhb-compact .fhb-icon { width: 18px; height: 18px; }
      `}</style>
    </Link>
  );
}
