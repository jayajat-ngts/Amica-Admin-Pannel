import { useState, useEffect } from "react";
import { updateUserStatus } from "../../api/users";
import { Modal } from "../ui/modal";

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    userId: string;
    userName: string;
    status: "active" | "inactive" | "suspended" | "banned";
  };
  onStatusUpdated: () => void;
}

const statusOptions = [
  { value: "active", label: "Active", icon: "🟢", colorClass: "text-emerald-600 dark:text-emerald-400" },
  { value: "inactive", label: "Inactive", icon: "⚪", colorClass: "text-gray-600 dark:text-gray-400" },
  { value: "suspended", label: "Suspended", icon: "🟡", colorClass: "text-orange-600 dark:text-orange-400" },
  { value: "banned", label: "Banned", icon: "🔴", colorClass: "text-red-600 dark:text-red-400" },
] as const;

export default function StatusUpdateModal({ isOpen, onClose, user, onStatusUpdated }: StatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<"active" | "inactive" | "suspended" | "banned">(user.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset modal state when user changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(user.status);
      setError(null);
    }
  }, [isOpen, user.status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus === user.status) {
      onClose();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await updateUserStatus(user.userId, selectedStatus);
      onStatusUpdated();
      onClose();
    } catch (err) {
      console.error("Failed to update user status:", err);
      setError(err instanceof Error ? err.message : "Failed to update user status");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[600px] p-0"
    >
      <div className="flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Select Status
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update status for {user.userName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800 transition"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 mb-6">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Select Status
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedStatus(option.value)}
                    className={`group relative p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02] ${
                      selectedStatus === option.value
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 ring-2 ring-violet-200 dark:ring-violet-700 shadow-md'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                    }`}
                  >
                    {selectedStatus === option.value && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{option.icon}</span>
                      <div>
                        <span className={`font-semibold text-sm ${option.colorClass}`}>
                          {option.label}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {option.value === 'active' ? 'Full access to platform' :
                           option.value === 'inactive' ? 'Limited access' :
                           option.value === 'suspended' ? 'Temporary restriction' :
                           'Permanently blocked'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl"
                disabled={loading || selectedStatus === user.status}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating...
                  </span>
                ) : (
                  "Update Status"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}