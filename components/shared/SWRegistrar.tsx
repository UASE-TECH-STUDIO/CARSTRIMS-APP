"use client";

import { useEffect } from "react";

export default function SWRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" })
      .then(reg => {
        // Warm cache for key pages after 3s
        setTimeout(() => {
          if (reg.active) {
            reg.active.postMessage({
              type: "WARM_CACHE",
              pages: ["/feed", "/login", "/register", "/dashboard/dealer", "/dashboard/user"],
            });
          }
        }, 3000);
      }).catch(() => {});
  }, []);

  return null;
}
