import { useState } from "react";
import {
  Notification,
  NotificationType,
  markNotificationAsRead,
  deleteNotification,
} from "../../api/notifications";
import { TrashBinIcon, CheckLineIcon, TimeIcon } from "../../icons";
import { formatDistanceToNow } from "date-fns";

interface NotificationListProps {
  notifications: Notification[];
  onRefresh: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onRefresh,
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleMarkAsRead = async (id: string) => {
    try {
      setLoading(id);
      await markNotificationAsRead(id);
      onRefresh();
    } catch (err: any) {
      console.error("Failed to mark as read:", err);
      alert(err.message || "Failed to mark notification as read");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      setLoading(id);
      await deleteNotification(id);
      onRefresh();
    } catch (err: any) {
      console.error("Failed to delete:", err);
      alert(err.message || "Failed to delete notification");
    } finally {
      setLoading(null);
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "contest_update":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "wallet_update":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "match_update":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No notifications found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`relative rounded-lg border p-4 transition-colors ${
            notification.isRead
              ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
              : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTypeColor(
                    notification.type
                  )}`}
                >
                  {notification.type}
                </span>
                {!notification.isRead && (
                  <span className="inline-flex items-center px-2 py-1 rounded bg-brand-500 text-white text-xs font-medium">
                    New
                  </span>
                )}
              </div>

              {/* Title */}
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                {notification.title}
              </h4>

              {/* Message */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {notification.body}
              </p>

              {/* Recipient Info */}
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mb-2">
                <span className="flex items-center gap-1">
                  <span className="font-medium">To:</span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    {notification.recipientType}
                  </span>
                  {notification.recipientValue && (
                    <span className="text-gray-600 dark:text-gray-400">
                      {notification.recipientValue}
                    </span>
                  )}
                </span>
                
                {/* Delivery Status */}
                <span className={`flex items-center gap-1 px-2 py-1 rounded ${
                  notification.isSent 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                }`}>
                  {notification.isSent ? '✓ Sent' : '⏳ Pending'}
                </span>
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                <TimeIcon className="w-3 h-3" />
                <span>
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              {/* Additional Data */}
              {notification.data && Object.keys(notification.data).length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-brand-600 dark:text-brand-400 cursor-pointer">
                    View details
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                    {JSON.stringify(notification.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {!notification.isRead && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  disabled={loading === notification.id}
                  className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                  title="Mark as read"
                >
                  <CheckLineIcon className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => handleDelete(notification.id)}
                disabled={loading === notification.id}
                className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                title="Delete"
              >
                <TrashBinIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationList;
