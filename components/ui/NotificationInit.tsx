"use client";
import { useNotificationManager } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

export default function NotificationInit() {
  const { isAuthenticated } = useAuthStore();
  useNotificationManager();
  // Just mounting this component starts the notification manager
  return null;
}
