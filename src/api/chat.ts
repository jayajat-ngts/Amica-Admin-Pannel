import { api } from "../utils/axios";

/* ================= Backend Message Type ================= */
interface BackendChatMessage {
  _id: string;
  message: string;
  timestamp: string;
}

/* ================= Frontend Message Type ================= */
export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  createdAt: string;
}

/* ================= API ================= */
/**
 * GET /api/admin/users/:id/chat-history
 */
export const getChatHistoryApi = async (
  userId: string,
  from: string, // e.g. "2025-09-01"
  to: string    // e.g. "2025-09-30"
): Promise<ChatMessage[]> => {
  const res = await api.get<{
    success: boolean;
    data: {
      user_id: string;
      messages: BackendChatMessage[];
    };
  }>(
    `/api/admin/users/${userId}/chat-history?from=${from}&to=${to}`
  );

  if (!res.data?.success) {
    throw new Error("Failed to fetch chat history");
  }

  const messages = res.data.data.messages || [];

  /* ✅ Normalize backend → frontend */
  return messages.map((msg, index) => ({
    id: msg._id,
    text: msg.message,
    createdAt: msg.timestamp,
    sender: index % 2 === 0 ? "user" : "bot", // temporary logic
  }));
};
