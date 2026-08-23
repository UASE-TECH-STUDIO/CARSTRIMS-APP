import type { Metadata } from "next";
import CarDetailClient from "./CarDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * This file is deliberately a server component (no "use client") so
 * it can export generateMetadata - the actual page UI is entirely in
 * CarDetailClient.tsx, unchanged from before.
 *
 * Without this, sharing a car link (WhatsApp, Facebook, Twitter, etc.)
 * showed no image preview at all - a "use client" page cannot export
 * generateMetadata, so the page had no choice but to inherit the root
 * layout's generic site-wide Open Graph tags (a fixed logo image, not
 * the actual car being shared), which is exactly what link preview
 * generators use to decide what to show.
 *
 * Fetches from the dedicated /meta endpoint, not the full detail
 * endpoint - that one increments viewCount on every call, and this
 * runs on every page load including crawler link-preview fetches,
 * which would have double-counted every real view too.
 */
export async function generateMetadata({ params }: { params: { carId: string } }): Promise<Metadata> {
  const { carId } = params;

  try {
    const res = await fetch(`${API_BASE}/api/v1/public/cars/${carId}/meta`, {
      next: { revalidate: 300 }, // cache for 5 minutes - link previews don't need to be second-by-second fresh
    });
    if (!res.ok) throw new Error("not found");
    const car = await res.json();

    const title = `${car.brand || ""} ${car.model || ""} ${car.year || ""}`.trim() || "Vehicle";
    const priceText = car.sellingPrice ? `NGN ${Number(car.sellingPrice).toLocaleString()}` : "";
    const locationText = [car.city, car.state].filter(Boolean).join(", ");
    const description = [priceText, locationText, car.description].filter(Boolean).join(" — ").slice(0, 200)
      || `${title} available on CARSTRIMS`;

    const images = car.image ? [{ url: car.image, width: 1200, height: 900, alt: title }] : undefined;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | CARSTRIMS`,
        description,
        images,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | CARSTRIMS`,
        description,
        images: car.image ? [car.image] : undefined,
      },
    };
  } catch {
    // Car not found or the API call failed - fall back to the root
    // layout's generic metadata rather than breaking the page.
    return {};
  }
}

export default function CarDetailPage() {
  return <CarDetailClient />;
}
