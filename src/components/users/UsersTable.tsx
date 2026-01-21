import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { fetchUsers, BackendUser as User } from "../../api/users";
import { useNavigate } from "react-router";
import StatusUpdateModal from "./StatusUpdateModal";

export default function UsersTable() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  // Status update modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Filters and pagination
  // const [search, setSearch] = useState<string>("");
  const [activeFilter] = useState<"all" | boolean>("all");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetchUsers({
        // search,
        active: activeFilter,
        page,
        pageSize,
      });
      setUsers(res.items);
      setTotal(res.total || res.items.length);
    } catch (e: unknown) {
      console.log(e);
      setErr("Failed to load users.");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = (id: string) => {
    navigate(`/users/${id}`);
  };

  const handleUpdateStatus = (user: User) => {
    setSelectedUser(user);
    setStatusModalOpen(true);
  };

  const handleStatusUpdated = () => {
    load(); // Reload the users list
  };

  const goPrev = () => {
    if (loading || page <= 1) return;
    setPage((p) => p - 1);
  };

  const goNext = () => {
    if (loading || page >= totalPages) return;
    setPage((p) => p + 1);
  };

  useEffect(() => {
    load();
  }, [activeFilter, page]);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-xs font-semibold text-gray-700 dark:text-gray-300 text-left uppercase tracking-wider"
                >
                  User
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-xs font-semibold text-gray-700 dark:text-gray-300 text-left uppercase tracking-wider"
                >
                  Contact
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-xs font-semibold text-gray-700 dark:text-gray-300 text-left uppercase tracking-wider"
                >
                  Provider
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-xs font-semibold text-gray-700 dark:text-gray-300 text-left uppercase tracking-wider"
                >
                  Wallet
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-xs font-semibold text-gray-700 dark:text-gray-300 text-left uppercase tracking-wider"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-6 py-4 text-xs font-semibold text-gray-700 dark:text-gray-300 text-left uppercase tracking-wider"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {err && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-6 py-8 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl">⚠️</div>
                      <div className="text-sm font-medium text-red-600 dark:text-red-400">{err}</div>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-3 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-6xl">👥</div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white">No users found</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Users will appear here once they register</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                          {(u.userName || u.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-gray-900 dark:text-white">
                            {u.userName || 'Anonymous User'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {u.userId.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <span className="text-gray-400">📱</span>
                          {u.phoneNumber || '-'}
                        </div>
                        {u.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            <span className="text-gray-400">✉️</span>
                            <span className="truncate">{u.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.authData.email
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : u.authData.phoneNumber
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                        {u.authData.email ? '📧 Email' : u.authData.phoneNumber ? '📱 Phone' : '🔐 ' + u.authData.provider}
                      </span>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💰</span>
                        <span className="font-bold text-violet-600 dark:text-violet-400">
                          {(u.walletData?.balance || 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">pts</span>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {/* User Status Badge */}
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : u.status === 'inactive'
                              ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                              : u.status === 'suspended'
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                          <span className="mr-1">
                            {u.status === 'active' ? '🟢' : u.status === 'inactive' ? '⚪' : u.status === 'suspended' ? '🟡' : '🔴'}
                          </span>
                          {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                        </span>

                        {u.type === 'admin' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            👑 Admin
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleActive(u.userId)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-all duration-200"
                        >
                          <span>👁️</span>
                          View
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(u)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all duration-200"
                        >
                          <span>⚙️</span>
                          Status
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Page {page} of {totalPages} • {total} result{total !== 1 ? 's' : ''}
          </div>

          <div className="flex gap-2">
            <button
              onClick={goPrev}
              disabled={loading || page <= 1}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition"
            >
              ← Previous
            </button>

            <button
              onClick={goNext}
              disabled={loading || page >= totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Status Update Modal */}

      </div>
      {selectedUser && (
        <StatusUpdateModal
          isOpen={statusModalOpen}
          onClose={() => {
            setStatusModalOpen(false);
            setSelectedUser(null);
          }}
          user={{
            userId: selectedUser.userId,
            userName: selectedUser.userName || selectedUser.email || 'Unknown User',
            status: selectedUser.status,
          }}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </>
  );
}
