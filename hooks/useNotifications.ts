"use client";
import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const POLL_INTERVAL_MS = 20000; // 20 seconds
const PREFS_KEY = "carstrims_notif_prefs";

export interface NotifPrefs {
  systemNotif: boolean;
  sound: boolean;
}

export function getPrefs(): NotifPrefs {
  if (typeof window === "undefined") return { systemNotif: true, sound: true };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : { systemNotif: true, sound: true };
  } catch { return { systemNotif: true, sound: true }; }
}

export function savePrefs(prefs: NotifPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// Play the notification sound
function playSound() {
  try {
    const prefs = getPrefs();
    if (!prefs.sound) return;
    // Try AudioContext first (works even when tab is in background)
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      // Generate a short "ding" tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      ctx.close();
      return;
    }
    // Fallback: try audio file
    const audio = new Audio("/audio.mp3");
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch (_) {}
}

// Show a browser notification (if granted)
function showBrowserNotification(title: string, body: string, url: string = "/") {
  try {
    const prefs = getPrefs();
    if (!prefs.systemNotif) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const n = new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-72.png",
      tag: "carstrims-" + Date.now(),
      silent: !prefs.sound,
    });
    n.onclick = () => {
      window.focus();
      window.location.href = url;
      n.close();
    };
    // Auto-close after 6s
    setTimeout(() => n.close(), 6000);
  } catch (_) {}
}

// Register service worker
async function registerSW() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (_) {}
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined") return "denied";
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch { return "denied"; }
}

let lastSeenCount = -1;

export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get("/api/v1/notifications/?limit=5&unread=true");
      const unread: number = res.data?.unreadCount || (res.data?.notifications || []).filter((n: any) => !n.isRead).length || 0;
      const latest = (res.data?.notifications || [])[0];

      if (lastSeenCount === -1) {
        // First load — just set baseline
        lastSeenCount = unread;
        return;
      }

      if (unread > lastSeenCount && latest) {
        // New notification arrived
        playSound();
        showBrowserNotification(
          latest.title || "CARSTRIMS",
          latest.message || "You have a new notification",
          "/dashboard"
        );
        lastSeenCount = unread;
      } else {
        lastSeenCount = unread;
      }
    } catch (_) {}
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Register service worker
    registerSW();

    // Request permission proactively (will show browser prompt)
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      requestPermission();
    }

    // Start polling
    lastSeenCount = -1;
    checkNotifications();
    pollRef.current = setInterval(checkNotifications, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isAuthenticated, checkNotifications]);

  return { requestPermission, getPrefs, savePrefs };
}
