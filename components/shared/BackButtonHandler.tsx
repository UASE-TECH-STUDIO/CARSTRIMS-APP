"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Makes the Android hardware/gesture back button (and, by extension,
 * consistent in-app back behavior generally) work the way it does in
 * every other native app: go back to the previous screen if there is
 * one, or minimize the app (not crash/exit abruptly) if the user is
 * already at one of the app's "home" screens.
 *
 * Capacitor's default behavior without this listener can be
 * inconsistent for a client-side-routed app like this one — it either
 * does nothing, or exits the app outright instead of navigating back
 * through the screens the user actually visited.
 *
 * iOS's edge-swipe-to-go-back gesture is handled separately, natively,
 * in ios/App/App/ViewController.swift (allowsBackForwardNavigationGestures).
 */

// Pages considered "home" for each context — pressing back here backgrounds
// the app instead of trying to go further back (which would otherwise exit
// to a blank/undefined state or leave the app on a login-adjacent screen).
const HOME_PATHS = new Set<string>([
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
  const navigatedBackRef = useRef(false);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const isCapacitor = typeof (window as any).Capacitor !== "undefined" &&
      (window as any).Capacitor?.isNativePlatform?.();
    if (!isCapacitor) return;

    let removeListener: (() => void) | null = null;

    const setup = async () => {
      try {
        const { App } = await import("@capacitor/app");

        const handle = await App.addListener("backButton", () => {
          const current = pathnameRef.current || "/";

          // Close any open modal/overlay first if the app has flagged one
          // as open — many of this app's modals are just conditional
          // renders, not real routes, so give them first refusal via a
          // custom event before falling back to router navigation.
          const closeEvent = new CustomEvent("carstrims:back-pressed", { cancelable: true });
          const notPrevented = window.dispatchEvent(closeEvent);
          if (!notPrevented) return; // something handled it (closed a modal)

          if (HOME_PATHS.has(current) || window.history.length <= 1) {
            App.minimizeApp();
            return;
          }

          navigatedBackRef.current = true;
          router.back();
        });

        removeListener = () => { handle.remove(); };
      } catch {
        // @capacitor/app not available (e.g. not yet synced natively) —
        // fail silently rather than break the app on web/older builds.
      }
    };

    setup();
    return () => { if (removeListener) removeListener(); };
  }, [router]);

  return null;
}
