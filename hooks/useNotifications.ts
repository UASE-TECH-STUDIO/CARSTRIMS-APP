"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useSocket } from "./useSocket";

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

export const useNotifications = () => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/notifications/", {
        params: { limit: 30 },
      });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;

    const handleNew = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
    };

    socket.on("notification:new", handleNew);
    return () => { socket.off("notification:new", handleNew); };
  }, [socket]);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/api/v1/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { }
  };

  return { notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchNotifications };
};
