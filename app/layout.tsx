import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  icons: { icon: '/logo.png', shortcut: '/logo.png', apple: '/logo.png' },
  title: "CARSTRIMS - Premium Car Dealer Platform",
  description: "Multi-tenant car dealer management platform by UASE TECH STUDIO",
};

"use client";
import { useEffect } from "react";

function SWRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" })
      .then(reg => {
        // Warm cache for key pages after 3s
        setTimeout(() => {
          if (reg.active) {
            reg.active.postMessage({
              type: "WARM_CACHE",
              pages: ["/feed", "/login", "/register", "/dashboard/dealer", "/dashboard/user"],
            });
          }
        }, 3000);
      }).catch(() => {});
  }, []);
  return null;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SWRegistrar />
        {children}
      </body>
    </html>
  );
}

