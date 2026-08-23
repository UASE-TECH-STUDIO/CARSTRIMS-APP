"use client";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Marks <html> with a "is-native-app" class when running inside the
 * actual Capacitor native app (iOS/Android), vs a regular mobile
 * browser tab.
 *
 * This exists specifically to fix a real double-spacing bug: the
 * StatusBar plugin is configured with overlaysWebView: false, which
 * means the native OS already pushes the entire WebView down below
 * the status bar on its own - there's no need for the app's own CSS
 * to add safe-area-inset-top padding on top of that already-pushed-
 * down content. But that same CSS padding is genuinely needed when
 * someone visits the site in a regular mobile browser tab (Safari/
 * Chrome), where no such native push-down exists and the notch/
 * status bar area would otherwise sit on top of the app's content.
 *
 * Mounted once in the root layout.
 */
export default function PlatformClass() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      document.documentElement.classList.add("is-native-app");
    }
  }, []);

  return null;
}
