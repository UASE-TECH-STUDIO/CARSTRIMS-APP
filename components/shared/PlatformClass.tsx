"use client";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Marks <html> with platform-specific classes when running inside
 * the actual Capacitor native app, vs a regular mobile browser tab.
 *
 * "is-native-app" - true for either native platform (iOS or Android).
 * "is-native-ios" / "is-native-android" - the specific platform,
 * since the two behave differently here and were incorrectly treated
 * as identical before.
 *
 * The StatusBar plugin is configured with overlaysWebView: false,
 * intended to push the WebView down below the status bar at the OS
 * level on both platforms. On iOS this reliably works, confirmed by
 * a real device report - so the app's own top safe-area CSS padding
 * would double up on top of that already-pushed-down content there.
 * On Android, this same setting is known to be inconsistent (a
 * documented Capacitor/Android quirk, worse on newer Android versions
 * that enforce edge-to-edge display regardless of this setting) -
 * confirmed by the same report: the exact same page collided with
 * the status bar on Android while it was fine on iPhone. So Android
 * still needs the real CSS safe-area-inset-top padding as a
 * necessary supplement to the native setting, not a redundant
 * double-up like on iOS.
 *
 * Mounted once in the root layout.
 */
export default function PlatformClass() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      document.documentElement.classList.add("is-native-app");
      const platform = Capacitor.getPlatform();
      if (platform === "ios") {
        document.documentElement.classList.add("is-native-ios");
      } else if (platform === "android") {
        document.documentElement.classList.add("is-native-android");
      }
    }
  }, []);

  return null;
}
