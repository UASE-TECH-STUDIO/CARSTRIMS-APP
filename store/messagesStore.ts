import { create } from "zustand";

interface MessagesState {
  openConvId: string | null;    // conversation to auto-open
  openCarContext: {             // car context to show in chat
    carId: string;
    carBrand?: string;
    carModel?: string;
    carYear?: number;
    carImage?: string;
    carPrice?: number;
  } | null;
  // Actions
  openConversation: (convId: string, carContext?: MessagesState["openCarContext"]) => void;
  clearOpen: () => void;
}

export const useMessagesStore = create<MessagesState>((set) => ({
  openConvId: null,
  openCarContext: null,
  openConversation: (convId, carContext = null) =>
    set({ openConvId: convId, openCarContext: carContext }),
  clearOpen: () => set({ openConvId: null, openCarContext: null }),
}));