"use client";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";

let socketInstance: Socket | null = null;

export const useSocket = () => {
  const { user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        auth: { token: user.accessToken },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
    }

    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance?.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
    });

    return () => {
      // Don't disconnect on unmount — keep alive across pages
    };
  }, [user]);

  return socketRef.current || socketInstance;
};

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
