// src/api/notifications.ts
import { api } from "../utils/axios";

export type NotificationType = 
  | "info"
  | "success" 
  | "warning"
  | "error"
  | "contest_update"
  | "wallet_update"
  | "match_update"
  | "system";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface Notification {
  id: string;
  userId: string | null;
  recipientType: 'user_id' | 'email' | 'phone' | 'all_users';
  recipientValue: string | null;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string | null;
  actionUrl?: string | null;
  deviceToken?: string | null;
  isSent: boolean;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string | null;
  sentAt?: string | null;
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  read?: boolean;
  type?: NotificationType;
}

export interface SendNotificationPayload {
  recipientType: 'user_id' | 'email' | 'phone' | 'all_users';
  userId?: string;
  recipientValue?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
}

export interface SendBulkNotificationPayload {
  notifications: {
    recipientType: 'user_id' | 'email' | 'phone' | 'all_users';
    userId?: string;
    recipientValue?: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
  }[];
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: unknown;
  timestamp?: string;
  total?: number;
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/**
 * Fetch all notifications (paginated)
 */
export async function fetchNotifications(
  query: NotificationQuery = {}
): Promise<{ items: Notification[]; total: number; page: number; limit: number }> {
  try {
    const params: Record<string, unknown> = {};
    if (typeof query.page === "number") params.page = query.page;
    if (typeof query.limit === "number") params.limit = query.limit;
    if (typeof query.read === "boolean") params.read = query.read;
    if (query.type) params.type = query.type;

    const res = await api.get<ApiEnvelope<Notification[]>>("/notifications", { params });

    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to fetch notifications");
    }

    const body = res.data;
    return {
      items: body.data || [],
      total: body.total || 0,
      page: body.pagination?.page || 1,
      limit: body.pagination?.limit || 20,
    };
  } catch (err: any) {
    console.error("fetchNotifications error:", err);
    throw new Error(err?.response?.data?.message || err.message || "Failed to fetch notifications");
  }
}

/**
 * Get unread notification count
 */
export async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await api.get<ApiEnvelope<{ count: number }>>("/notifications/unread/count");

    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to fetch unread count");
    }

    return res.data.data.count || 0;
  } catch (err: any) {
    console.error("fetchUnreadCount error:", err);
    throw new Error(err?.response?.data?.message || err.message || "Failed to fetch unread count");
  }
}

/**
 * Get single notification by ID
 */
export async function fetchNotificationById(id: string): Promise<Notification> {
  try {
    const res = await api.get<ApiEnvelope<Notification>>(`/notifications/${id}`);

    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to fetch notification");
    }

    return res.data.data;
  } catch (err: any) {
    console.error("fetchNotificationById error:", err);
    throw new Error(err?.response?.data?.message || err.message || "Failed to fetch notification");
  }
}

/**
 * Mark single notification as read
 */
export async function markNotificationAsRead(id: string): Promise<Notification> {
  try {
    const res = await api.patch<ApiEnvelope<Notification>>(`/notifications/${id}/read`);

    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to mark notification as read");
    }

    return res.data.data;
  } catch (err: any) {
    console.error("markNotificationAsRead error:", err);
    throw new Error(err?.response?.data?.message || err.message || "Failed to mark notification as read");
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const res = await api.patch<ApiEnvelope<{ updated: number }>>("/notifications/read-all");

    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to mark all notifications as read");
    }
  } catch (err: any) {
    console.error("markAllNotificationsAsRead error:", err);
    throw new Error(err?.response?.data?.message || err.message || "Failed to mark all notifications as read");
  }
}

/**
 * Delete single notification
 */
export async function deleteNotification(id: string): Promise<void> {
  try {
    const res = await api.delete<ApiEnvelope<void>>(`/notifications/${id}`);

    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to delete notification");
    }
  } catch (err: any) {
    console.error("deleteNotification error:", err);
    throw new Error(err?.response?.data?.message || err.message || "Failed to delete notification");
  }
}

/**
 * Delete all notifications
 */
export async function deleteAllNotifications(): Promise<void> {
  try {
    const res = await api.delete<ApiEnvelope<{ deleted: number }>>("/notifications");

    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to delete all notifications");
    }
  } catch (err: any) {
    console.error("deleteAllNotifications error:", err);
    throw new Error(err?.response?.data?.message || err.message || "Failed to delete all notifications");
  }
}

/**
 * Fetch ALL notifications for admin panel (no authentication required)
 */
export async function fetchAllNotificationsForAdmin(
  query: { page?: number; limit?: number } = {}
): Promise<{ notifications: Notification[]; total: number }> {
  try {
    const params: Record<string, unknown> = {};
    if (typeof query.page === "number") params.page = query.page;
    if (typeof query.limit === "number") params.limit = query.limit;

    const res = await api.get<ApiEnvelope<{ notifications: Notification[]; total: number }>>("/notifications/all", { params });

    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to fetch all notifications");
    }

    return res.data.data;
  } catch (err: any) {
    console.error("fetchAllNotificationsForAdmin error:", err);
    throw new Error(err?.response?.data?.message || err.message || "Failed to fetch all notifications");
  }
}

/**
 * Send notification to a single user
 */
export async function sendNotification(payload: SendNotificationPayload): Promise<Notification> {
  try {
    const res = await api.post<ApiEnvelope<Notification>>("/notifications/send", payload);

    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to send notification");
    }

    return res.data.data;
  } catch (err: any) {
    console.error("sendNotification error:", err);
    throw new Error(err?.response?.data?.message || err.message || "Failed to send notification");
  }
}

/**
 * Send notifications to multiple users
 */
export async function sendBulkNotifications(payload: SendBulkNotificationPayload): Promise<{ sent: number; failed: number }> {
  try {
    const res = await api.post<ApiEnvelope<{ sent: number; failed: number }>>("/notifications/send-bulk", payload);

    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to send bulk notifications");
    }

    return res.data.data;
  } catch (err: any) {
    console.error("sendBulkNotifications error:", err);
    throw new Error(err?.response?.data?.message || err.message || "Failed to send bulk notifications");
  }
}
