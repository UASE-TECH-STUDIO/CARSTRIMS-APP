"use client";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

export default function NotificationInit() {
  const { isAuthenticated } = useAuthStore();
  useNotifications();
  // Just mounting this component starts the notification manager
  return null;
}
