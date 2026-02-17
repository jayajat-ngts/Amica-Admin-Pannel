import React, { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUsersApi, User } from "../../api/user";

const ChatUsersPage: React.FC = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(""); // ✅ NEW

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const data = await getUsersApi(1, 100);
        setUsers(data);
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  /* ================= FILTER USERS ================= */
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ===== Header + Search ===== */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Chat History</h1>

        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border px-4 py-2 w-64 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-center">View</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-gray-400">
                  Loading users...
                </td>
              </tr>
            )}

            {!loading &&
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() =>
                        navigate(`/chat-history/${user.id}`)
                      }
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}

            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-gray-400">
                  No matching users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChatUsersPage;
