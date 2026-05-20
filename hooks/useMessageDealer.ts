"use client";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useMessagesStore } from "@/store/messagesStore";

/**
 * useMessageDealer — opens a conversation with any user directly in the MessagesWidget.
 * No page navigation. The widget pops open with the right conversation active.
 * 
 * Usage:
 *   const { startChat, starting } = useMessageDealer();
 *   <button onClick={() => startChat(receiverId, carContext)}>Message Dealer</button>
 */
export function useMessageDealer() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const openConversation = useMessagesStore(s => s.openConversation);

  const startChat = async (
    receiverId: string,
    carContext?: {
      carId?: string;
      carBrand?: string;
      carModel?: string;
      carYear?: number;
      carImage?: string;
      carPrice?: number;
    } | null
  ) => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!receiverId) { alert("Cannot open chat — dealer contact not found."); return; }

    try {
      const payload: any = { receiverId };
      if (carContext?.carId) {
        payload.carId    = carContext.carId;
        payload.carBrand = carContext.carBrand;
        payload.carModel = carContext.carModel;
        payload.carYear  = carContext.carYear;
        payload.carImage = carContext.carImage;
        payload.carPrice = carContext.carPrice;
      }

      const res = await api.post("/api/v1/messages/start", payload);
      const convId = res.data?.conversationId;
      if (convId) {
        // Open the widget directly — no navigation
        openConversation(convId, carContext ? {
          carId:    carContext.carId || "",
          carBrand: carContext.carBrand,
          carModel: carContext.carModel,
          carYear:  carContext.carYear,
          carImage: carContext.carImage,
          carPrice: carContext.carPrice,
        } : null);
      }
    } catch (e: any) {
      alert(e.response?.data?.detail || "Could not open chat. Try WhatsApp or Call.");
    }
  };

  return { startChat };
}