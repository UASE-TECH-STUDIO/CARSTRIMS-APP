"use client";
import Link from "next/link";

/**
 * Design Studio (ID Cards) - muted per request, not deleted.
 *
 * The full working implementation is preserved at
 * page.tsx.bak-designstudio in this same folder (and the sibling
 * business-docs/marketing folders), along with all the shared
 * design components in components/design-studio/ - none of that
 * code was removed, only disconnected from routing.
 *
 * This whole feature is being spun out into its own separate app
 * (a broader document/branding suite: ID cards, business docs, CVs,
 * cover letters, business/professional cards, posters, company-level
 * marketing materials) rather than staying part of this one. When
 * that's ready, this route can be restored (rename the .bak file
 * back to page.tsx) or replaced with a thin redirect/embed pointing
 * at the new app.
 */
export default function IdCardsMuted() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", textAlign: "center", gap: "0.75rem", padding: "2rem" }}>
      <div style={{ fontSize: "2rem" }}>🎨</div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "#1A1A1A" }}>Design Studio - Coming Back Soon</h2>
      <p style={{ fontSize: "0.85rem", color: "#737373", maxWidth: "360px", lineHeight: 1.6 }}>
        ID Cards, Business Documents, and Marketing Materials are being rebuilt as their own dedicated app for a richer set of business and professional documents. This section will return once that's ready.
      </p>
      <Link href="/dashboard/dealer" style={{ marginTop: "0.5rem", color: "#F47B20", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none" }}>
        Back to Overview
      </Link>
    </div>
  );
}
