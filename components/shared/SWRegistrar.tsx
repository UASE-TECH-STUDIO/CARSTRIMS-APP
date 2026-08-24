"use client";
import { useEffect } from "react";

// Falls back to a REAL key pair generated for this deployment if the
// env var isn't set (matching VAPID_PRIVATE_KEY given for the backend)
// — the previous fallback value here had no corresponding private key
// configured anywhere, so any subscription created with it could never
// actually receive a push; the backend would reject every send attempt
// with a signature mismatch. Setting NEXT_PUBLIC_VAPID_PUBLIC_KEY
// properly in Vercel is still the right long-term fix, but this
// fallback is now at least functional rather than silently broken.
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BO2Qs_hqwFLaZ4CUht943Lg-ePxEV7lExG7IHPYebdfyPq0Ms6tXLPzJNqOq4CIwvq3lmJs3-uMfzcLjLRAdUkE";

function b64ToUint8(b64: string): Uint8Array {
  const pad  = "=".repeat((4 - b64.length % 4) % 4);
  const base = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from([...atob(base)].map(c => c.charCodeAt(0)));
}

function playNotificationSound() {
  try {
    const prefs = JSON.parse(localStorage.getItem("notif_prefs") || "{}");
    if (prefs.dnd || prefs.sound === false || prefs.soundType === "none") return;
    if (prefs.soundType === "beep") {
      const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.value = 880;
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(); osc.stop(ctx.currentTime + 0.35);
      return;
    }
    const a = new Audio("/audio.mp3"); a.volume = 0.7; a.play().catch(() => {});
  } catch {}
}

async function saveSub(sub: PushSubscription) {
  try {
    const raw = localStorage.getItem("auth-storage");
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

async function subscribePush(reg: ServiceWorkerRegistration) {
  try {
    const existing = await reg.pushManager.getSubscription();
    if (existing) { await saveSub(existing); return; }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: b64ToUint8(VAPID_PUBLIC_KEY),
    });
    await saveSub(sub);
    console.log("[Push] Subscribed successfully");
  } catch (e) { console.log("[Push] Subscribe failed:", e); }
}

async function askPermissionAndSubscribe(reg: ServiceWorkerRegistration, immediate = false) {
  if (!("Notification" in window) || !("PushManager" in window)) return;
  if (Notification.permission === "granted") { await subscribePush(reg); return; }
  if (Notification.permission === "denied") return;

  const doAsk = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        await subscribePush(reg);
        reg.showNotification("CARSTRIMS Notifications Active", {
          body: "You will receive instant alerts even when the app is closed.",
          icon: "/icon-192.png", badge: "/icon-72.png", tag: "welcome",
        });
      }
    } catch {}
  };

  // If user just logged in  ask immediately (no delay)
  // Otherwise give browser 2s to settle
  if (immediate) { doAsk(); }
  else { setTimeout(doAsk, 2000); }
}

// Global: expose a function to trigger push permission after login
(globalThis as any).__carstrims_requestPush = async () => {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    await askPermissionAndSubscribe(reg, true); // immediate = true
  } catch {}
};

export default function SWRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const run = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;

        // If already logged in  ask for push permission with slight delay
        const raw = localStorage.getItem("auth-storage");
        if (raw && JSON.parse(raw)?.state?.isAuthenticated) {
          await askPermissionAndSubscribe(reg, false);
        }

        // Watch for login  ask IMMEDIATELY
        window.addEventListener("storage", async (e) => {
          if (e.key !== "auth-storage" || !e.newValue) return;
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed?.state?.isAuthenticated) {
              const r = await navigator.serviceWorker.ready;
              await askPermissionAndSubscribe(r, true); // immediate after login
            }
          } catch {}
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener("message", (e) => {
          if (e.data?.type === "PLAY_SOUND") playNotificationSound();
          if (e.data?.type === "NAVIGATE" && e.data.url) window.location.href = e.data.url;
        });
      } catch (err) { console.log("[SW] Failed:", err); }
    };

    run();
  }, []);

  return null;
}
