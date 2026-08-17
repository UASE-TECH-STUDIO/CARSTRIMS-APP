"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const HOME_PATHS = new Set<string>([
  "/",
  "/feed",
  "/dashboard/user",
  "/dashboard/dealer",
  "/dashboard/staff",
  "/dashboard/partner",
  "/dashboard/super-admin",
  "/login",
]);

export default function BackButtonHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const isCapacitor =
      typeof (window as any).Capacitor !== "undefined" &&
      (window as any).Capacitor?.isNativePlatform?.();
    if (!isCapacitor) return;

    let removeListener: (() => void) | null = null;

    const setup = async () => {
      try {
        const { App } = await import("@capacitor/app");

        const handle = await App.addListener("backButton", () => {
          const current = pathnameRef.current || "/";

          // 1. Give custom modals/overlays first refusal
          const closeEvent = new CustomEvent("carstrims:back-pressed", {
            cancelable: true,
          });
          const notPrevented = window.dispatchEvent(closeEvent);
          if (!notPrevented) return;

          // 2. Minimize if on a registered home screen
          if (HOME_PATHS.has(current)) {
            App.minimizeApp();
            return;
          }

          // 3. Navigate back in Next.js router history if on a sub-page
          if (window.history.length > 1) {
            router.back();
          } else {
            App.minimizeApp();
          }
        });

        removeListener = () => {
          handle.remove();
        };
      } catch {
        // Fail silently if plugin is missing on web
      }
    };

    setup();
    return () => {
      if (removeListener) removeListener();
    };
  }, [router]);

  return null;
}