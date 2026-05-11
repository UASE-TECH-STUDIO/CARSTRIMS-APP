import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CARSTRIMS - Premium Car Dealer Platform",
  description: "Multi-tenant car dealer management by UASE TECH STUDIO",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}