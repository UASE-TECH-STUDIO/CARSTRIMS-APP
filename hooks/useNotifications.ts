"use client";
import { useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";

const POLL_INTERVAL = 20000; // 20 seconds

export function useNotificationManager() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCheckRef = useRef<string>(new Date().toISOString());
  const permissionRef = useRef<NotificationPermission>("default");

  // Load user prefs from localStorage
  const getPrefs = () => {
    try {
      const raw = localStorage.getItem("carstrims-notif-prefs");
      if (raw) return JSON.parse(raw);
    } catch { }
    return { systemNotif: true, sound: true };
  };

  const savePrefs = (prefs: { systemNotif: boolean; sound: boolean }) => {
    localStorage.setItem("carstrims-notif-prefs", JSON.stringify(prefs));
  };

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      permissionRef.current = perm;
    } else {
      permissionRef.current = Notification.permission;
    }
  }, []);

  const registerSW = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch { }
  }, []);

  const playSound = useCallback(() => {
    const prefs = getPrefs();
    if (!prefs.sound) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/audio.mp3");
        audioRef.current.volume = 0.7;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch { }
  }, []);

  const showSystemNotif = useCallback((title: string, body: string, url?: string) => {
    const prefs = getPrefs();
    if (!prefs.systemNotif) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      const notif = new Notification(title, {
        body,
        icon: "/icon-192.png",
        tag: "carstrims-" + Date.now(),
        silent: !prefs.sound,
      });
      notif.onclick = () => {
        window.focus();
        if (url) window.location.href = url;
        notif.close();
      };
      setTimeout(() => notif.close(), 8000);
    } catch { }
  }, []);

  const checkNewNotifs = useCallback(async () => {
    try {
      const res = await api.get(`/api/v1/notifications/?limit=5`);
      const notifs = res.data.notifications || [];
      const newOnes = notifs.filter((n: any) =>
        !n.isRead && new Date(n.createdAt) > new Date(lastCheckRef.current)
      );
      if (newOnes.length > 0) {
        lastCheckRef.current = new Date().toISOString();
        playSound();
        newOnes.slice(0, 3).forEach((n: any) => {
          showSystemNotif(n.title || "CARSTRIMS", n.message || "", "/dashboard/user/notifications");
        });
      }
    } catch { }
  }, [playSound, showSystemNotif]);

  useEffect(() => {
    requestPermission();
    registerSW();
    const t = setInterval(checkNewNotifs, POLL_INTERVAL);
    return () => clearInterval(t);
  }, [requestPermission, registerSW, checkNewNotifs]);

  return { getPrefs, savePrefs, requestPermission };
}
