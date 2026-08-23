import type { Metadata } from "next";
import DealerProfileClient from "./DealerProfileClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Server component so it can export generateMetadata - same fix as
 * the car detail page. UI is entirely in DealerProfileClient.tsx,
 * unchanged from before.
 */
export async function generateMetadata({ params }: { params: { dealerId: string } }): Promise<Metadata> {
  const { dealerId } = params;

  try {
    const res = await fetch(`${API_BASE}/api/v1/public/dealers/${dealerId}/meta`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error("not found");
    const dealer = await res.json();

    const title = dealer.companyName || "Dealer";
    const locationText = [dealer.city, dealer.state].filter(Boolean).join(", ");
    const description = [locationText, dealer.description].filter(Boolean).join(" — ").slice(0, 200)
      || `${title} on CARSTRIMS`;

    const images = dealer.logo ? [{ url: dealer.logo, width: 800, height: 800, alt: title }] : undefined;

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
        images: dealer.logo ? [dealer.logo] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default function DealerProfilePage() {
  return <DealerProfileClient />;
}
