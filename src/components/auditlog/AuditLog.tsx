import React, { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { getAuditLogsApi, AuditLog } from "../../api/audit";

const actionColor: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-yellow-100 text-yellow-700",
  delete: "bg-red-100 text-red-700",
  login: "bg-indigo-100 text-indigo-700",
};

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  /* ===== FETCH LOGS ===== */
  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        const data = await getAuditLogsApi();
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);
  useEffect(() => {
  if (selectedLog) {
    document.body.classList.add("modal-open");
  } else {
    document.body.classList.remove("modal-open");
  }

  return () => {
    document.body.classList.remove("modal-open");
  };
}, [selectedLog]);


  const filteredLogs = logs.filter(
    (log) =>
      log.actor_email.toLowerCase().includes(search.toLowerCase()) ||
      log.module.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>

        <input
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border px-4 py-2"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Action</th>
              <th className="p-4 text-left">Module</th>
              <th className="p-4 text-left">Target ID</th>
              <th className="p-4 text-left">Date & Time</th>
              <th className="p-4 text-left">Browser</th>
              <th className="p-4 text-center">View</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="p-6 text-center">
                  Loading audit logs...
                </td>
              </tr>
            )}

            {!loading &&
              filteredLogs.map((log) => (
                <tr
                  key={log._id}
                  className="border-t hover:bg-gray-50"
                >
                  {/* User */}
                  <td className="p-4 font-medium">
                    {log.actor_email}
                  </td>

                  {/* Action */}
                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        actionColor[log.action] ||
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>

                  {/* Module */}
                  <td className="p-4 capitalize">{log.module}</td>

                  {/* Target ID */}
                  <td className="p-4 text-xs text-gray-600 font-mono">
                    {log.target_id}
                  </td>

                  {/* Date */}
                  <td className="p-4">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>

                  {/* Browser */}
                  <td className="p-4">
                    {log.user_agent.includes("Chrome")
                      ? "Chrome"
                      : log.user_agent.includes("Safari")
                      ? "Safari"
                      : log.user_agent.includes("Firefox")
                      ? "Firefox"
                      : "Other"}
                  </td>

                  {/* View */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}

            {!loading && !filteredLogs.length && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No audit logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== METADATA MODAL ===== */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">Audit Log Details</h2>

            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">User:</span>{" "}
                {selectedLog.actor_email}
              </div>

              <div>
                <span className="font-medium">Action:</span>{" "}
                {selectedLog.action}
              </div>

              <div>
                <span className="font-medium">Module:</span>{" "}
                {selectedLog.module}
              </div>

              <div>
                <span className="font-medium">Target ID:</span>{" "}
                <span className="font-mono text-xs">
                  {selectedLog.target_id}
                </span>
              </div>

              <div>
                <span className="font-medium">IP:</span>{" "}
                {selectedLog.ip}
              </div>

              <div>
                <span className="font-medium">Browser:</span>{" "}
                {selectedLog.user_agent}
              </div>

              <div>
                <span className="font-medium">Metadata:</span>
                <pre className="mt-2 rounded-lg bg-gray-100 p-3 text-xs overflow-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
