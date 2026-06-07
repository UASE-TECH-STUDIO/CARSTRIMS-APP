"use client";
import { useEffect } from "react";
import api from "@/lib/api";

/**
 * Handles push notifications in the Capacitor (Android/iOS) app.
 * - Registers device token with backend
 * - Shows notification when app is in foreground
 * - Navigates to correct page when notification tapped
 */
export default function CapacitorPush() {
  useEffect(() => {
    const isCapacitor = typeof (window as any).Capacitor !== "undefined";
    if (!isCapacitor) return;

    const setup = async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const { LocalNotifications } = await import("@capacitor/local-notifications");

        // Request permission
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== "granted") return;

        // Register with FCM
        await PushNotifications.register();

        // Save FCM token to backend
        await PushNotifications.addListener("registration", async (token) => {
          console.log("[FCM] Token:", token.value);
          try {
            await api.post("/api/v1/push/register-device", {
              token: token.value,
              platform: (window as any).Capacitor?.getPlatform() || "android",
            });
          } catch (e) { console.log("[FCM] Token save failed:", e); }
        });

        // Foreground notification - show local notification + play sound
        await PushNotifications.addListener("pushNotificationReceived", async (notif) => {
          console.log("[FCM] Foreground push:", notif);

          // Play sound based on user settings
          const prefs = JSON.parse(localStorage.getItem("notif_prefs") || "{}");
          const soundType = prefs.soundType || "music";
          const dnd = prefs.dnd === true;

          if (!dnd && soundType !== "none") {
            try {
              if (soundType === "music") {
                const a = new Audio("/audio.mp3"); a.volume = 0.8; a.play().catch(() => {});
              } else if (soundType === "beep") {
                const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator(), g = ctx.createGain();
                osc.connect(g); g.connect(ctx.destination);
                osc.frequency.value = 880;
                g.gain.setValueAtTime(0, ctx.currentTime);
                g.gain.linearRampToValueAtTime(0.4, ctx.currentTime+0.01);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.5);
                osc.start(); osc.stop(ctx.currentTime+0.5);
              }
            } catch {}
          }

          // Show local notification (so it appears even in foreground)
          await LocalNotifications.schedule({
            notifications: [{
              id: Date.now(),
              title: notif.title || "CARSTRIMS",
              body:  notif.body  || "",
              extra: notif.data  || {},
              sound: soundType === "music" ? undefined : undefined,
              smallIcon: "ic_launcher",
              iconColor: "#F47B20",
            }]
          }).catch(() => {});
        });

        // Background/quit notification tap - navigate to correct page
        await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          const data = action.notification.data || {};
          const url = data.url || "/dashboard";
          window.location.href = url;
        });

      } catch (e) {
        console.log("[CapacitorPush] Setup error:", e);
      }
    };

    setup();

    return () => {
      const isCapacitor = typeof (window as any).Capacitor !== "undefined";
      if (!isCapacitor) return;
      import("@capacitor/push-notifications").then(({ PushNotifications }) => {
        PushNotifications.removeAllListeners();
      }).catch(() => {});
    };
  }, []);

  return null;
}
