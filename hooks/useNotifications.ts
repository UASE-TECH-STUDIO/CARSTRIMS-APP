"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export function useNotifications() {
  const { isAuthenticated, user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCountRef = useRef(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const registeredRef = useRef(false);

  // Init audio
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      audioRef.current = new Audio("/audio.mp3");
      audioRef.current.volume = 0.7;
      audioRef.current.preload = "auto";
    } catch(_) {}
  }, []);

  const playSound = useCallback(() => {
    if (!audioRef.current) return;
    const a = audioRef.current;
    a.currentTime = 0;
    a.play().catch(() => {
      // Retry after user gesture
      document.addEventListener("click", () => a.play().catch(()=>{}), { once:true });
    });
  }, []);

  const showSystemNotif = useCallback((title: string, body: string, url = "/") => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    try {
      // Use service worker notification for better reliability
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: "/icon-192.png",
            badge: "/icon-72.png",
            tag: "carstrims-" + Date.now(),
            data: { url },
            vibrate: [200, 100, 200],
          }).catch(() => {
            // Fallback to Notification API
            new Notification(title, { body, icon:"/icon-192.png" });
          });
        }).catch(() => {
          new Notification(title, { body, icon:"/icon-192.png" });
        });
      } else {
        new Notification(title, { body, icon:"/icon-192.png" });
      }
    } catch(_) {}
  }, []);

  // Register service worker and cache auth token for background access
  const registerSW = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (registeredRef.current) return;
    try {
      await navigator.serviceWorker.register("/sw.js");
      registeredRef.current = true;
      // Cache the token so SW can use it in background
      if ("caches" in window) {
        const raw = localStorage.getItem("auth-storage");
        if (raw) {
          const parsed = JSON.parse(raw);
          const token = parsed?.state?.user?.accessToken;
          if (token) {
            const cache = await caches.open("carstrims-v1");
            await cache.put("/auth-token", new Response(token));
          }
        }
      }
    } catch(_) {}
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      return perm;
    }
    return Notification.permission;
  }, []);

  // Poll for notifications
  const poll = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get("/api/v1/notifications/?limit=20");
      const items: Notification[] = res.data?.notifications || res.data || [];
      const unread = items.filter((n) => !n.isRead).length;

      setNotifications(items);
      setUnreadCount(unread);

      // New notification arrived
      if (lastCountRef.current >= 0 && unread > lastCountRef.current) {
        playSound();
        // Show system notification for each new unread
        const newOnes = items.filter((n) => !n.isRead).slice(0, unread - lastCountRef.current);
        for (const n of newOnes) {
          showSystemNotif(n.title, n.message);
        }
      }
      lastCountRef.current = unread;
    } catch(_) {}
  }, [isAuthenticated, playSound, showSystemNotif]);

  const markRead = useCallback(async (id: string) => {
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
      setNotifications((p) => p.map((n) => n._id === id ? {...n, isRead:true} : n));
      setUnreadCount((c) => Math.max(0, c - 1));
      if (lastCountRef.current > 0) lastCountRef.current--;
    } catch(_) {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.patch("/api/v1/notifications/read-all");
      setNotifications((p) => p.map((n) => ({...n, isRead:true})));
      setUnreadCount(0);
      lastCountRef.current = 0;
    } catch(_) {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    registerSW();

    // Ask for permission on first load
    requestPermission().then((perm) => {
      if (perm === "granted") poll();
    });
    poll();

    // Poll every 15 seconds
    timerRef.current = setInterval(poll, 15000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isAuthenticated, poll, registerSW, requestPermission]);

  return { notifications, unreadCount, markRead, markAllRead, refetch: poll };
}