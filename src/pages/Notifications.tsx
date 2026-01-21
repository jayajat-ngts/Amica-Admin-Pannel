import { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import NotificationsTable from "../components/notifications/NotificationsTable";
import SendNotificationForm from "../components/notifications/SendNotificationForm";
import {
  fetchAllNotificationsForAdmin,
  Notification,
} from "../api/notifications";


export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [showSendForm, setShowSendForm] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAllNotificationsForAdmin({
        page,
        limit,
      });
      setNotifications(Array.isArray(result.notifications) ? result.notifications : []);
      setTotal(result.total || 0);
    } catch (err: unknown) {
      console.error("Failed to load notifications:", err);
      setError("Failed to load notifications");
      setNotifications([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);





  const unreadCount = Array.isArray(notifications) ? notifications.filter((n) => !n.isRead).length : 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <PageMeta
        title="Notifications | WizPlay Admin Dashboard"
        description="Manage and view notifications for WizPlay platform"
      />
      <PageBreadcrumb pageTitle="Notifications" />

      <div className="space-y-6">
        {/* Header with Stats and Actions */}
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Total: {total} | Unread: {unreadCount}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowSendForm(!showSendForm)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors"
              >
                {showSendForm ? "Hide Form" : "Send Notification"}
              </button>
              <button
                onClick={loadNotifications}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Send Notification Form */}
        {showSendForm && (
          <SendNotificationForm
            onSuccess={() => {
              setShowSendForm(false);
              loadNotifications();
            }}
          />
        )}

        {/* Admin Info */}
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                All Sent Notifications
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View all notifications sent from the system to users
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">Total:</span> {total}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          {loading ? (
            <div className="text-center py-12 px-5">
              <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 px-5">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={loadNotifications}
                className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <NotificationsTable
                  notifications={notifications}
                />
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
