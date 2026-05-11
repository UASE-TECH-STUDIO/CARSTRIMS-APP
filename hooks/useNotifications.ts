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

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refetch: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Init audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        audioRef.current = new Audio("/audio.mp3");
        audioRef.current.volume = 0.5;
      } catch (_) {}
    }
  }, []);

  // Register service worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  const playSound = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const showSystemNotif = useCallback((title: string, body: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon-192.png" });
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get("/api/v1/notifications/?limit=20");
      const items: Notification[] = res.data?.notifications || res.data || [];
      const unread = items.filter((n) => !n.isRead).length;
      setNotifications(items);
      setUnreadCount(unread);

      if (unread > lastCountRef.current && lastCountRef.current >= 0) {
        playSound();
        const newest = items.find((n) => !n.isRead);
        if (newest) showSystemNotif(newest.title, newest.message);
      }
      lastCountRef.current = unread;
    } catch (_) {}
  }, [isAuthenticated, playSound, showSystemNotif]);

  const markRead = useCallback(async (id: string) => {
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.patch("/api/v1/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      lastCountRef.current = 0;
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isAuthenticated, fetchNotifications]);

  return { notifications, unreadCount, markRead, markAllRead, refetch: fetchNotifications };
}