import type { Metadata } from "next";
import "./globals.css";
import SWRegistrar from "@/components/shared/SWRegistrar";

export const metadata: Metadata = {
  icons: { icon: '/logo.png', shortcut: '/logo.png', apple: '/logo.png' },
  title: "CARSTRIMS - Premium Car Dealer Platform",
  description: "Multi-tenant car dealer management platform by UASE TECH STUDIO",
};

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
