import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 
                   process.env.NEXT_PUBLIC_API_URL || 
                   "https://carstrims-api.onrender.com";

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 20000,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("⚠️ Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket error:", err.message);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export const joinChat = (threadId: string) => {
  getSocket()?.emit("chat_join", { threadId });
};

export const leaveChat = (threadId: string) => {
  getSocket()?.emit("chat_leave", { threadId });
};

export const sendChatMessage = (threadId: string, message: string, receiverId: string) => {
  getSocket()?.emit("chat_message", { threadId, message, receiverId });
};

export const sendTyping = (threadId: string, isTyping: boolean) => {
  getSocket()?.emit("chat_typing", { threadId, isTyping });
};

export const subscribeToFeed = () => {
  getSocket()?.emit("feed_subscribe");
};
