import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const POLL_MS = 30000; // poll every 30 seconds

interface NotifPrefs {
  systemNotif: boolean;
  sound: boolean;
}

export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  const lastSeenRef = useRef<string|null>(null);
  const audioRef    = useRef<HTMLAudioElement|null>(null);

  // ── Read / write preferences ────────────────────────────────
  const getPrefs = useCallback((): NotifPrefs => {
    try {
      const s = localStorage.getItem("notif_prefs");
      if (s) return JSON.parse(s);
    } catch {}
    return { systemNotif: true, sound: true };
  }, []);

  const savePrefs = useCallback((p: NotifPrefs) => {
    try { localStorage.setItem("notif_prefs", JSON.stringify(p)); } catch {}
  }, []);

  // ── Request browser permission ──────────────────────────────
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return "denied";
    if (Notification.permission === "granted") return "granted";
    return Notification.requestPermission();
  }, []);

  // ── Play audio.mp3 from /public ────────────────────────────
  const playSound = useCallback(() => {
    if (!getPrefs().sound) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/audio.mp3");
        audioRef.current.volume = 0.6;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Browser may block autoplay — user must interact first
      });
    } catch {}
  }, [getPrefs]);

  // ── Show system/OS notification ────────────────────────────
  const showSystemNotif = useCallback((title: string, body: string, url?: string) => {
    if (!getPrefs().systemNotif) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    try {
      const n = new Notification(title, {
        body,
        icon:  "/icon-192.png",
        badge: "/icon-192.png",
        tag:   "carstrims-notif",
        requireInteraction: false,
      });
      if (url) {
        n.onclick = () => { window.focus(); window.location.href = url; n.close(); };
      }
      setTimeout(() => n.close(), 5000);
    } catch {}
  }, [getPrefs]);

  // ── Poll for new notifications ─────────────────────────────
  const checkForNew = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res  = await api.get("/api/v1/notifications/?limit=5");
      const list: any[] = res.data.notifications || res.data || [];
      if (!list.length) return;

      const top = list[0];

      // First load — record current latest, don't fire
      if (lastSeenRef.current === null) {
        lastSeenRef.current = top._id;
        return;
      }

      // New unread notification arrived since last check
      if (top._id !== lastSeenRef.current && !top.isRead) {
        lastSeenRef.current = top._id;
        playSound();
        showSystemNotif(
          top.title   || "CARSTRIMS",
          top.message || "You have a new notification",
          getNotifUrl(top)
        );
      }
    } catch {}
  }, [isAuthenticated, playSound, showSystemNotif]);

  // ── Bootstrap ──────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    // Ask for permission silently on first mount
    requestPermission().catch(() => {});
    // Initial check
    checkForNew();
    // Poll
    const t = setInterval(checkForNew, POLL_MS);
    return () => clearInterval(t);
  }, [isAuthenticated, checkForNew, requestPermission]);

  return { getPrefs, savePrefs, requestPermission, playSound, showSystemNotif };
}

// Map notification type/message to a dashboard route
function getNotifUrl(n: any): string {
  const m = (n.message || "").toLowerCase();
  if (n.type === "message" || m.includes("message"))   return "/dashboard/user/messages";
  if (m.includes("request"))                           return "/dashboard/user/requests";
  if (m.includes("appointment"))                       return "/dashboard/user/appointments";
  if (m.includes("favorite") || m.includes("car"))    return "/dashboard/user/favorites";
  return "/dashboard/user/notifications";
}
