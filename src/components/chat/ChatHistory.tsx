import React, { useState } from "react";

/* ================= Types ================= */
interface User {
  id: string;
  name: string;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
}

/* ================= Dummy Data ================= */
const users: User[] = [
  { id: "1", name: "Ananya" },
  { id: "2", name: "Riya" },
  { id: "3", name: "Pooja" },
  { id: "4", name: "Aditi" },
];

const chatHistory: Record<string, Message[]> = {
  "1": [
    { id: "m1", sender: "user", text: "Hi", time: "10:02 AM" },
    { id: "m2", sender: "bot", text: "Hello Ananya", time: "10:03 AM" },
  ],
};

/* ================= Component ================= */
const ChatHistoryPage: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  const messages = selectedUser ? chatHistory[selectedUser] || [] : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">Chat History</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* ================= User List with Search ================= */}
        <div className="md:col-span-1 bg-white rounded-2xl shadow p-4">
          <h2 className="text-lg font-semibold mb-3">
            Select User
          </h2>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full mb-3 border rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />

          {/* User List */}
          <div className="max-h-72 overflow-y-auto space-y-1">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No users found
              </p>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm ${
                    selectedUser === user.id
                      ? "bg-indigo-100 text-indigo-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {user.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ================= Chat History ================= */}
        <div className="md:col-span-3 bg-white rounded-2xl shadow p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">
            {selectedUser
              ? `Chat with ${
                  users.find((u) => u.id === selectedUser)?.name
                }`
              : "No user selected"}
          </h2>

          <div className="flex-1 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-center mt-20">
                Select a user to view chat history
              </p>
            ) : (
              messages.map((msg) => (
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
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryPage;
