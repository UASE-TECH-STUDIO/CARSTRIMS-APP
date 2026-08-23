import type { Metadata } from "next";
import UserProfileClient from "./UserProfileClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Server component so it can export generateMetadata - same fix as
 * the car detail and dealer profile pages. UI is entirely in
 * UserProfileClient.tsx, unchanged from before.
 */
export async function generateMetadata({ params }: { params: { userId: string } }): Promise<Metadata> {
  const { userId } = params;

  try {
    const res = await fetch(`${API_BASE}/api/v1/public/users/${userId}/meta`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error("not found");
    const user = await res.json();

    const title = user.fullName || "User";
    const locationText = [user.city, user.state].filter(Boolean).join(", ");
    const description = [locationText, user.bio].filter(Boolean).join(" — ").slice(0, 200)
      || `${title} on CARSTRIMS`;

    const images = user.avatar ? [{ url: user.avatar, width: 800, height: 800, alt: title }] : undefined;

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
        images: user.avatar ? [user.avatar] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default function PublicUserProfilePage() {
  return <UserProfileClient />;
}
