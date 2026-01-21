import { useState } from "react";
import {
  sendNotification,
  sendBulkNotifications,
  NotificationType,
  SendNotificationPayload,
  SendBulkNotificationPayload,
} from "../../api/notifications";
import { PaperPlaneIcon } from "../../icons";

interface SendNotificationFormProps {
  onSuccess: () => void;
}

const SendNotificationForm: React.FC<SendNotificationFormProps> = ({
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [isBulk, setIsBulk] = useState(false);
  const [formData, setFormData] = useState({
    recipientType: "email" as 'user_id' | 'email' | 'phone' | 'all_users',
    userId: "",
    userIds: "",
    recipientValue: "",
    type: "info" as NotificationType,
    title: "",
    message: "",
    data: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      alert("Title and message are required");
      return;
    }

    // Validate based on recipient type
    if (!isBulk) {
      if (formData.recipientType === 'user_id' && !formData.userId.trim()) {
        alert("Please enter a user ID");
        return;
      }
      if ((formData.recipientType === 'email' || formData.recipientType === 'phone') && !formData.recipientValue.trim()) {
        alert(`Please enter a ${formData.recipientType}`);
        return;
      }
    } else {
      if (!formData.userIds.trim()) {
        alert("Please enter at least one recipient");
        return;
      }
    }

    try {
      setLoading(true);

      let additionalData: Record<string, unknown> | undefined;
      if (formData.data.trim()) {
        try {
          additionalData = JSON.parse(formData.data);
        } catch {
          alert("Invalid JSON in additional data field");
          setLoading(false);
          return;
        }
      }

      if (isBulk) {
        const userIds = formData.userIds
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id);

        const payload: SendBulkNotificationPayload = {
          notifications: userIds.map((recipient) => ({
            recipientType: formData.recipientType,
            userId: formData.recipientType === 'user_id' ? recipient : undefined,
            recipientValue: formData.recipientType !== 'user_id' ? recipient : undefined,
            type: formData.type,
            title: formData.title,
            body: formData.message,
            data: additionalData,
          })),
        };

        const result = await sendBulkNotifications(payload);
        alert(`Successfully sent ${result.sent} notifications. Failed: ${result.failed}`);
      } else {
        const payload: SendNotificationPayload = {
          recipientType: formData.recipientType,
          userId: formData.recipientType === 'user_id' ? formData.userId : undefined,
          recipientValue: formData.recipientType !== 'user_id' && formData.recipientType !== 'all_users' ? formData.recipientValue : undefined,
          type: formData.type,
          title: formData.title,
          body: formData.message,
          data: additionalData,
        };

        await sendNotification(payload);
        alert("Notification sent successfully!");
      }

      // Reset form
      setFormData({
        recipientType: "email",
        userId: "",
        userIds: "",
        recipientValue: "",
        type: "info",
        title: "",
        message: "",
        data: "",
      });
      onSuccess();
    } catch (err: unknown) {
      console.error("Failed to send notification:", err);
      alert((err as Error).message || "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Send Notification
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bulk/Single Toggle */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="notificationType"
              checked={!isBulk}
              onChange={() => setIsBulk(false)}
              className="w-4 h-4 text-brand-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Single User
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="notificationType"
              checked={isBulk}
              onChange={() => setIsBulk(true)}
              className="w-4 h-4 text-brand-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Bulk (Multiple Users)
            </span>
          </label>
        </div>

        {/* Recipient Type Selection */}
        {!isBulk && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Send To *
            </label>
            <select
              value={formData.recipientType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recipientType: e.target.value as 'user_id' | 'email' | 'phone' | 'all_users',
                  userId: "",
                  recipientValue: "",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            >
              <option value="email">Email Address</option>
              <option value="phone">Phone Number</option>
              <option value="user_id">User ID</option>
              <option value="all_users">All Users (Broadcast)</option>
            </select>
          </div>
        )}

        {/* Recipient Input */}
        {isBulk ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recipients (comma-separated) *
            </label>
            <textarea
              value={formData.userIds}
              onChange={(e) =>
                setFormData({ ...formData, userIds: e.target.value })
              }
              placeholder={`${formData.recipientType === 'email' ? 'email1@example.com, email2@example.com' : formData.recipientType === 'phone' ? '+91xxxxxxxxxx, +91xxxxxxxxxx' : 'user-id-1, user-id-2'}`}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter multiple {formData.recipientType === 'email' ? 'email addresses' : formData.recipientType === 'phone' ? 'phone numbers' : 'user IDs'} separated by commas
            </p>
          </div>
        ) : formData.recipientType !== 'all_users' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {formData.recipientType === 'email' ? 'Email Address' : formData.recipientType === 'phone' ? 'Phone Number' : 'User ID'} *
            </label>
            <input
              type={formData.recipientType === 'email' ? 'email' : 'text'}
              value={formData.recipientType === 'user_id' ? formData.userId : formData.recipientValue}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [formData.recipientType === 'user_id' ? 'userId' : 'recipientValue']: e.target.value
                })
              }
              placeholder={
                formData.recipientType === 'email' 
                  ? 'user@example.com' 
                  : formData.recipientType === 'phone' 
                  ? '+91xxxxxxxxxx' 
                  : 'Enter user ID'
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
            {formData.recipientType === 'phone' && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Include country code (e.g., +91 for India)
              </p>
            )}
          </div>
        ) : (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              📢 This notification will be sent to all users in the system.
            </p>
          </div>
        )}

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as NotificationType,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            required
          >
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="contest_update">Contest Update</option>
            <option value="wallet_update">Wallet Update</option>
            <option value="match_update">Match Update</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Notification title"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            required
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message *
          </label>
          <textarea
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            placeholder="Notification message"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            required
          />
        </div>

        {/* Additional Data (JSON) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Additional Data (JSON, optional)
          </label>
          <textarea
            value={formData.data}
            onChange={(e) =>
              setFormData({ ...formData, data: e.target.value })
            }
            placeholder='{"key": "value"}'
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PaperPlaneIcon className="w-5 h-5" />
          {loading ? "Sending..." : isBulk ? "Send to All Users" : "Send Notification"}
        </button>
      </form>
    </div>
  );
};

export default SendNotificationForm;
