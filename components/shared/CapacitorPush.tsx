"use client";
import { useEffect } from "react";
import api from "@/lib/api";

/**
 * Handles push notifications in the Capacitor (Android/iOS) app.
 * All imports are dynamic so this file compiles fine on Vercel (web build).
 */
export default function CapacitorPush() {
  useEffect(() => {
    // Only run inside actual Capacitor app (not web browser)
    const isCapacitor = typeof (window as any).Capacitor !== "undefined" &&
                        (window as any).Capacitor?.isNativePlatform?.();
    if (!isCapacitor) return;

    const setup = async () => {
      try {
        // Dynamic import - only loads on device, not on Vercel build
        const { PushNotifications } = await import("@capacitor/push-notifications");

        // Request permission
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== "granted") {
          console.log("[FCM] Push permission denied");
          return;
        }

        // Register with FCM/APNs
        await PushNotifications.register();

        // Save FCM token to backend when received
        await PushNotifications.addListener("registration", async (token) => {
          console.log("[FCM] Device token received");
          try {
            const platform = (window as any).Capacitor?.getPlatform?.() || "android";
            await api.post("/api/v1/push/register-device", {
              token: token.value,
              platform,
            });
            console.log("[FCM] Token saved to backend");
          } catch (e) {
            console.log("[FCM] Token save failed:", e);
          }
        });

        await PushNotifications.addListener("registrationError", (err) => {
          console.error("[FCM] Registration error:", err);
        });

        // Foreground push: play sound + show browser notification
        await PushNotifications.addListener("pushNotificationReceived", async (notif) => {
          console.log("[FCM] Push received in foreground:", notif.title);
          playAppSound();

          // Show via browser Notification API as fallback (works inside WebView)
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try {
              new Notification(notif.title || "CARSTRIMS", {
                body: notif.body || "",
                icon: "/icon-192.png",
                badge: "/icon-72.png",
              });
            } catch {}
          }
        });

        // Notification tapped (background or quit)
        await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          const data = action.notification.data || {};
          const url = data.url || "/dashboard";
          console.log("[FCM] Notification tapped, navigating to:", url);
          window.location.href = url;
        });

        console.log("[FCM] Push notification setup complete");

      } catch (e) {
        console.log("[CapacitorPush] Setup error:", e);
      }
    };

    setup();

    return () => {
      const isNative = typeof (window as any).Capacitor !== "undefined" &&
                       (window as any).Capacitor?.isNativePlatform?.();
      if (!isNative) return;
      import("@capacitor/push-notifications").then(({ PushNotifications }) => {
        PushNotifications.removeAllListeners().catch(() => {});
      }).catch(() => {});
    };
  }, []);

  return null;
}

function playAppSound() {
  try {
    const prefs = JSON.parse(localStorage.getItem("notif_prefs") || "{}");
    if (prefs.dnd === true) return;
    const soundType = prefs.soundType || "music";
    if (soundType === "none") return;

    if (soundType === "music") {
      const a = new Audio("/audio.mp3");
      a.volume = 0.8;
      a.play().catch(() => playBeep());
    } else if (soundType === "beep") {
      playBeep();
    }
  } catch {}
}

function playBeep() {
  try {
    const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}
