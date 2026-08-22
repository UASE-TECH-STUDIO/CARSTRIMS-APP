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
 */
export default function FeedHomeButton({ variant = "icon" }: { variant?: "icon" | "labeled" }) {
  if (variant === "labeled") {
    return (
      <Link href="/feed" className="fhb-labeled" title="Back to Feed" aria-label="Back to Feed">
        <span className="fhb-icon">⌂</span>
        <span>Feed</span>
        <style jsx>{`
          .fhb-labeled {
            display: flex; align-items: center; gap: 0.4rem;
            background: #FFF7ED; border: 1.5px solid #F47B20; color: #F47B20;
            border-radius: 8px; padding: 0.5rem 0.85rem; font-size: 0.82rem; font-weight: 700;
            text-decoration: none; white-space: nowrap; flex-shrink: 0;
          }
          .fhb-labeled:hover { background: #F47B20; color: #fff; }
          .fhb-icon { font-size: 1rem; line-height: 1; }
        `}</style>
      </Link>
    );
  }
  return (
    <Link href="/feed" className="fhb-icon-btn" title="Back to Feed" aria-label="Back to Feed">
      ⌂
      <style jsx>{`
        .fhb-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 8px;
          background: #FFF7ED; border: 1.5px solid #F47B20; color: #F47B20;
          font-size: 1.15rem; text-decoration: none; flex-shrink: 0; line-height: 1;
        }
        .fhb-icon-btn:hover { background: #F47B20; color: #fff; }
      `}</style>
    </Link>
  );
}
