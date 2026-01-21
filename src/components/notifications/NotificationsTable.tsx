import { useState } from "react";
import { Notification } from "../../api/notifications";
import { EyeIcon } from "../../icons";
import { formatDistanceToNow } from "date-fns";

interface NotificationsTableProps {
  notifications: Notification[];
}

const NotificationsTable: React.FC<NotificationsTableProps> = ({
  notifications,
}) => {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);



  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getRecipientDisplay = (notification: Notification) => {
    if (notification.recipientType === 'all_users') {
      return { type: 'Broadcast', value: 'All Users' };
    }
    return {
      type: notification.recipientType,
      value: notification.recipientValue || notification.userId || 'N/A'
    };
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No notifications found</p>
      </div>
    );
  }

  return (
    <>
      {/* Table */}
      <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                Type
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Title & Message
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36">
                Recipient
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                Created
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => {
              const recipient = getRecipientDisplay(notification);
              return (
                <tr key={notification.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {/* Type */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(notification.type)}`}>
                        {notification.type}
                      </span>
                      {!notification.isRead && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-brand-500 text-white text-xs font-medium">
                          New
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Title & Message */}
                  <td className="px-3 py-3">
                    <div className="max-w-sm">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {notification.body}
                      </p>
                    </div>
                  </td>

                  {/* Recipient */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {recipient.type}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {recipient.value}
                      </span>
                    </div>
                  </td>

                  {/* Delivery Status */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      notification.isSent 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {notification.isSent ? '✓' : '⏳'}
                    </span>
                  </td>

                  {/* Created Time */}
                  <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    <button
                      onClick={() => setSelectedNotification(notification)}
                      className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      title="View details"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

      {/* Modal for notification details */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notification Details
                </h3>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedNotification.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedNotification.body}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                    <span className={`mt-1 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTypeColor(selectedNotification.type)}`}>
                      {selectedNotification.type}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <span className={`mt-1 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      selectedNotification.isSent 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {selectedNotification.isSent ? 'Sent' : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Recipient Type</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedNotification.recipientType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Recipient Value</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white break-all">
                      {selectedNotification.recipientValue || selectedNotification.userId || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(selectedNotification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Updated</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(selectedNotification.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Additional Data</label>
                    <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-32">
                      {JSON.stringify(selectedNotification.data, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedNotification.errorMessage && (
                  <div>
                    <label className="block text-sm font-medium text-red-700 dark:text-red-300">Error Message</label>
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{selectedNotification.errorMessage}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationsTable;