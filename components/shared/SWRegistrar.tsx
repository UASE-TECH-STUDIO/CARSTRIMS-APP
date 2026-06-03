"use client";
import { useEffect } from "react";

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BD14o70t4jjR4qL-G4-T_M3LalDMX043D51sRbH2bIM8s5WnKAOMzeF00YN3lOwZJRc91GNuMr4YFG4Zi3NbXYc";

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const pad  = "=".repeat((4 - (b64.length % 4)) % 4);
  const base = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from([...atob(base)].map(c => c.charCodeAt(0)));
}

async function savePushSubscription(sub: PushSubscription) {
  try {
    const raw   = localStorage.getItem("auth-storage");
    if (!raw) return;
    const token = JSON.parse(raw)?.state?.user?.accessToken;
    if (!token) return;
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    await fetch(`${API}/api/v1/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(sub.toJSON()),
    });
  } catch {}
}

async function subscribeUserToPush(reg: ServiceWorkerRegistration) {
  try {
    const existing = await reg.pushManager.getSubscription();
    if (existing) { await savePushSubscription(existing); return; }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await savePushSubscription(sub);
  } catch (err) {
    console.log("[Push] Subscribe failed:", err);
  }
}

async function requestPushPermission(reg: ServiceWorkerRegistration) {
  if (!("Notification" in window) || !("PushManager" in window)) return;
  if (Notification.permission === "granted") {
    await subscribeUserToPush(reg); return;
  }
  if (Notification.permission === "denied") return;

  // Ask after 4 seconds  feels natural, not aggressive
  setTimeout(async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        await subscribeUserToPush(reg);
        reg.showNotification("CARSTRIMS Notifications Enabled ", {
          body: "You'll receive instant alerts for messages, requests and updates.",
          icon: "/icon-192.png",
          badge: "/icon-72.png",
          tag: "welcome-push",
        });
      }
    } catch {}
  }, 4000);
}

function playNotificationSound() {
  try {
    // Check DND preference
    const prefs = JSON.parse(localStorage.getItem("notif_prefs") || "{}");
    if (prefs.dnd === true || prefs.sound === false) return;

    const audio = new Audio("/audio.mp3");
    audio.volume = 0.7;
    audio.play().catch(() => {
      // Fallback beep if audio.mp3 fails
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    });
  } catch {}
}

export default function SWRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;

        // Warm cache
        setTimeout(() => {
          reg.active?.postMessage({
            type: "WARM_CACHE",
            pages: ["/feed", "/login", "/register"],
          });
        }, 3000);

        // Subscribe if logged in
        const raw = localStorage.getItem("auth-storage");
        if (raw && JSON.parse(raw)?.state?.isAuthenticated) {
          await requestPushPermission(reg);
        }

        // Listen for auth changes  subscribe on login
        window.addEventListener("storage", async (e) => {
          if (e.key !== "auth-storage" || !e.newValue) return;
          try {
            if (JSON.parse(e.newValue)?.state?.isAuthenticated) {
              const r = await navigator.serviceWorker.ready;
              await requestPushPermission(r);
            }
          } catch {}
        });

        // Listen for PLAY_SOUND messages from service worker
        navigator.serviceWorker.addEventListener("message", (e) => {
          if (e.data?.type === "PLAY_SOUND") {
            playNotificationSound();
          }
          // Handle in-app navigation from notification click
          if (e.data?.type === "NAVIGATE" && e.data.url) {
            window.location.href = e.data.url;
          }
        });

      } catch (err) {
        console.log("[SW] Registration failed:", err);
      }
    };

    register();
  }, []);

  return null;
}
