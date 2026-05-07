import type { Metadata } from "next";
import "@/styles/globals.css";
import HydrationProvider from "@/components/layout/HydrationProvider";

export const metadata: Metadata = {
  title: "CARSTRIMS — Premium Car Dealer Platform",
  description: "The #1 platform connecting car dealers, partners, staff and buyers in Africa. Powered by UASE TECH STUDIO.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <HydrationProvider>{children}</HydrationProvider>
      </body>
    </html>
  );
}
