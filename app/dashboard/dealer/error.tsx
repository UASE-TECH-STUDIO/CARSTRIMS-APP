"use client";
import { useEffect } from "react";

/**
 * A LOCAL error boundary, scoped to everything under /dashboard/user/*
 * — Next.js's App Router convention: this catches any crash within
 * this route segment and shows a retry UI in place, while the
 * surrounding layout (sidebar, topbar, nothing else) stays mounted
 * and usable, instead of the crash bubbling all the way up to the
 * single global app/error.tsx and wiping out the entire app shell.
 *
 * This was the actual bug behind "the notification page is broken" —
 * there was no per-route error boundary anywhere in the dashboard
 * tree, so ANY unhandled exception on ANY dashboard page, no matter
 * how small, replaced the whole app (sidebar, navigation, everything)
 * with the generic "Oops" screen. Adding this doesn't fix whatever
 * originally threw, but it stops that one failure from taking down
 * the person's entire session — they can navigate away and keep using
 * the app instead of being stuck on a dead end.
 */
export default function DashboardDealerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard (dealer) error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem", fontFamily: "var(--font-body, inherit)",
    }}>
      <div style={{
        maxWidth: "420px", width: "100%", background: "#fff", border: "1.5px solid #E5E5E5",
        borderRadius: "14px", padding: "2rem", display: "flex", flexDirection: "column",
        alignItems: "center", gap: "1rem", textAlign: "center",
      }}>
        <div style={{ fontSize: "2rem" }}>⚠️</div>
        <div style={{ fontFamily: "var(--font-display, inherit)", fontSize: "1.15rem", letterSpacing: "0.03em", color: "#1A1A1A" }}>
          This page had a problem loading
        </div>
        <p style={{ fontSize: "0.85rem", color: "#737373", lineHeight: 1.6 }}>
          Everything else in your dashboard is fine — just this page needs a retry.
        </p>
        {process.env.NODE_ENV === "development" && (
          <code style={{ fontSize: "0.7rem", color: "#DC2626", wordBreak: "break-all" as const, background: "#FEF2F2", padding: "0.6rem", borderRadius: "6px", width: "100%" }}>
            {error?.message}
          </code>
        )}
        <button
          onClick={reset}
          style={{ background: "#F47B20", color: "#fff", border: "none", borderRadius: "8px", padding: "0.75rem 1.5rem", fontFamily: "var(--font-display, inherit)", fontSize: "0.9rem", letterSpacing: "0.06em", cursor: "pointer" }}>
          Try Again
        </button>
      </div>
    </div>
  );
}
