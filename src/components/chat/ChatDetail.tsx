import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getChatHistoryApi, ChatMessage } from "../../api/chat";

const today = () => new Date().toISOString().split("T")[0];
const last30Days = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
};

const ChatHistoryDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(last30Days());
  const [to, setTo] = useState(today());

  useEffect(() => {
    if (!userId) return;

    const loadChat = async () => {
      try {
        setLoading(true);
        const data = await getChatHistoryApi(userId, from, to);
        setMessages(data);
      } catch (err) {
        console.error("Failed to load chat", err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [userId, from, to]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chat History</h1>
        <button
          onClick={() => navigate("/chat")}
          className="rounded-lg border px-4 py-2"
        >
          ← Back
        </button>
      </div>

      {/* Date Filters */}
      <div className="mb-4 flex gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border px-3 py-2"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border px-3 py-2"
        />
      </div>

      {/* Chat Box */}
      <div className="bg-white rounded-2xl shadow p-6 min-h-[500px]">
        {loading && (
          <p className="text-center text-gray-400">
            Loading chat history...
          </p>
        )}

        {!loading && messages.length === 0 && (
          <p className="text-center text-gray-400">
            No chat history found
          </p>
        )}

        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "user"
                  ? "justify-start"
                  : "justify-end"
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-xl text-sm ${
                  msg.sender === "user"
                    ? "bg-gray-100"
                    : "bg-indigo-600 text-white"
                }`}
              >
                <p>{msg.text}</p>
                <span className="block text-[10px] opacity-60 mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryDetailPage;
