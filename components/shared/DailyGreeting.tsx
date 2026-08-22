"use client";
import { useEffect, useRef } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

// Module-level guard (not component state) so this only fires once
// per actual app load, not once per component remount as the person
// navigates between pages within the same session.
let greetingTriggeredThisSession = false;

/**
 * Triggers the daily "good morning/afternoon/evening" push greeting
 * once the person is authenticated. Deliberately NOT gated to native-
 * only like CapacitorPush.tsx — this should reach web push
 * subscribers too, not just the installed app.
 *
 * No client-side "have I sent this today" tracking needed - the
 * backend endpoint is idempotent (only actually sends once per
 * calendar day per user, checked server-side), so this can safely
 * fire every time the app loads without worrying about being called
 * more than once a day.
 */
export default function DailyGreeting() {
  const { user, isAuthenticated } = useAuthStore();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (greetingTriggeredThisSession || firedRef.current) return;
    firedRef.current = true;
    greetingTriggeredThisSession = true;

    api.post("/api/v1/push/daily-greeting").catch(() => {
      // Silent failure — a missed greeting notification is not worth
      // bothering the person about, and it'll just try again next
      // time the app opens.
    });
  }, [isAuthenticated, user]);

  return null;
}
