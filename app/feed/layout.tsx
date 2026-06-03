import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Cars — Find Your Perfect Vehicle in Nigeria",
  description: "Browse thousands of cars for sale in Nigeria. Filter by brand, price, condition, location and more. Trusted dealers across Abuja, Lagos and all Nigerian states.",
  openGraph: {
    title: "Browse Cars — CARSTRIMS Nigeria",
    description: "Find brand new, foreign used and locally used cars from verified dealers across Nigeria.",
    url: "https://www.carstrims.com/feed",
    type: "website",
  },
  alternates: {
    canonical: "https://www.carstrims.com/feed",
  },
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
