"use client";
import { useEffect } from "react";

/**
 * Real, verified root cause of the iOS "black screen after opening
 * the app" bug: capacitor.config.ts had SplashScreen.launchAutoHide
 * set to true with a fixed launchShowDuration of 2000ms - the splash
 * (background color #1A1A1A, a very dark near-black) hides itself on
 * a blind timer with zero relationship to whether the remote app
 * (loaded via server.url, since this app has no meaningful local
 * bundle) has actually finished loading and rendering.
 *
 * On a fast/warm connection, 2 seconds happens to be enough and it
 * looks seamless. On a slower one - and a fresh install or an app
 * update is exactly a cold-cache, worst-case scenario for load time -
 * the timer fires before the page is ready, the dark splash
 * disappears, and what's left behind is an empty WKWebView that
 * hasn't painted anything yet. That reads as a stuck black screen,
 * not as "still loading" as far as the person holding the phone can
 * tell, with no way to know it would eventually resolve.
 *
 * Fix: launchAutoHide is now false (see capacitor.config.ts) and this
 * component explicitly hides the splash once React has actually
 * mounted and painted a first frame, however long that genuinely
 * takes on the person's real connection - a correctness-based signal
 * instead of a guessed timeout. A generous safety-net timeout still
 * force-hides it if something else goes wrong, so a bug elsewhere
 * can never leave the splash on screen forever.
 */
export default function SplashScreenController() {
  useEffect(() => {
    let hidden = false;

    const hide = async () => {
      if (hidden) return;
      hidden = true;
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide();
      } catch {
        // Not running under Capacitor (plain web) - nothing to hide.
      }
    };

    // Hide once the browser has painted a first real frame, not just
    // once React has committed to the DOM - requestAnimationFrame
    // (twice, to be past the paint that follows the commit) is a
    // closer proxy for "there is now visible content" than a mount
    // effect alone would be.
    requestAnimationFrame(() => requestAnimationFrame(hide));

    // Safety net: never let a bug elsewhere (a failed chunk load, an
    // uncaught error before first paint, a genuinely very slow
    // connection) leave the person staring at the splash forever.
    const safetyTimer = setTimeout(hide, 12000);

    return () => clearTimeout(safetyTimer);
  }, []);

  return null;
}
