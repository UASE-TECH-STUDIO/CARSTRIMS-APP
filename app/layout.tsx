import type { Metadata } from "next";
import "./globals.css";
import SWRegistrar from "@/components/shared/SWRegistrar";
import CapacitorPush from "@/components/shared/CapacitorPush";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.carstrims.com"),
  title: {
    default: "CARSTRIMS  Nigeria's Premier Car Dealer Platform",
    template: "%s | CARSTRIMS",
  },
  description: "Buy and sell premium vehicles in Nigeria. CARSTRIMS connects you with trusted car dealers across Abuja, Lagos, and beyond. Browse thousands of cars  brand new, foreign used, and locally used.",
  keywords: [
    "car dealer Nigeria", "buy car Nigeria", "sell car Nigeria",
    "car marketplace Nigeria", "foreign used cars Nigeria",
    "brand new cars Nigeria", "car dealer Abuja", "car dealer Lagos",
    "CARSTRIMS", "Nigeria car sales", "used cars Nigeria",
    "buy cars online Nigeria", "certified car dealers",
  ],
  authors: [{ name: "UASE TECH STUDIO", url: "https://www.carstrims.com" }],
  creator: "UASE TECH STUDIO",
  publisher: "CARSTRIMS",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://www.carstrims.com",
    siteName: "CARSTRIMS",
    title: "CARSTRIMS  Nigeria's Premier Car Dealer Platform",
    description: "Buy and sell premium vehicles in Nigeria. Browse thousands of cars from trusted dealers across Abuja, Lagos and beyond.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CARSTRIMS  Nigeria's Premier Car Dealer Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CARSTRIMS  Nigeria's Premier Car Dealer Platform",
    description: "Buy and sell premium vehicles in Nigeria. Browse thousands of cars from trusted dealers.",
    images: ["/og-image.png"],
    creator: "@carstrims",
  },
  icons: {
    icon: [
      { url: "/favicon.ico",  sizes: "any",           type: "image/x-icon" },
      { url: "/icon-16.png",  sizes: "16x16",         type: "image/png" },
      { url: "/icon-32.png",  sizes: "32x32",         type: "image/png" },
      { url: "/icon-72.png",  sizes: "72x72",         type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192",       type: "image/png" },
      { url: "/favicon.svg",  type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png",     sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://www.carstrims.com",
  },
  verification: {
    google: "Pt4BuXRR_OoKic89iqXs0V09dw-ejlPsoDB7-CBBfgc",
  },
  category: "automotive",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Structured data - Organisation */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "CARSTRIMS",
              "url": "https://www.carstrims.com",
              "logo": "https://www.carstrims.com/logo.png",
              "description": "Nigeria's Premier Car Dealer Platform  Buy and sell premium vehicles across Nigeria.",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "NG",
                "addressRegion": "FCT",
                "addressLocality": "Abuja",
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+234-806-520-6576",
                "contactType": "customer service",
                "availableLanguage": ["English"],
              },
              "sameAs": [
                "https://www.carstrims.com",
              ],
            }),
          }}
        />
        {/* Structured data - Website with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "CARSTRIMS",
              "url": "https://www.carstrims.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://www.carstrims.com/feed?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body>
        <SWRegistrar />
        <CapacitorPush />
        {children}
      </body>
    </html>
  );
}
