// src/api/users.ts
import { api } from "../utils/axios";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: unknown;
  timestamp?: string;
}

/** Detailed wallet data from backend */
export interface WalletData {
  id: string;
  userId: string;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalWinnings: number;
  totalReferralEarnings: number;
  currency: string;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  updatedAt: string;
}

/** Detailed auth data from backend */
export interface AuthData {
  id: string;
  userId: string;
  email: string | null;
  phoneNumber: string | null;
  provider: string;
  lastLoginAt: string | null;
  onboarded: boolean;
  type: "admin" | "user" | string;
  status: "active" | "inactive" | "suspended" | "banned";
  createdAt: string;
  updatedAt: string;
}

/** Backend user shape - updated to match actual API response */
export interface BackendUser {
  id: string;
  userId: string;
  authId: string;
  userName: string;
  email: string | null;
  name: string | null;
  phoneNumber: string | null;
  onboarded: boolean;
  type: "admin" | "user" | string;
  status: "active" | "inactive" | "suspended" | "banned";
  selectedLanguage: string;
  referralCode: string;
  deviceToken: string | null;
  createdAt: string;
  updatedAt: string;
  walletData: WalletData | null;
  authData: AuthData;
}

/** Frontend-friendly query */
export type UsersQuery = {
  search?: string;
  active?: boolean | "all";
  page?: number;
  pageSize?: number;
};

/** Referral data shape */
export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserName?: string;
  referredUserEmail?: string;
  status: "registered" | "active" | "inactive";
  bonusEarned: number;
  joinedAt: string;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Referral stats */
export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalBonusEarned: number;
  referralCode: string;
}

/** Response shape for listing users (data property) */
export interface UsersListPayload {
  items: BackendUser[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * Helper: build query string
 */
function buildQuery(q: UsersQuery) {
  const params = new URLSearchParams();
  if (q.search) params.set("search", q.search);
  if (q.active === true) params.set("active", "true");
  if (q.active === false) params.set("active", "false");
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));
  return params.toString();
}

/**
 * Fetch paginated users
 * GET /api/users?search=...&active=...&page=...&pageSize=...
 */
export async function fetchUsers(
  query: UsersQuery = {}
): Promise<UsersListPayload> {
  const qs = buildQuery(query);
  const url = `user/get-all-users${qs ? `?${qs}` : ""}`;

  const res = await api.get<ApiEnvelope<UsersListPayload>>(url);

  if (!res.data || res.data.success === false) {
    throw new Error(res.data?.message || "Failed to fetch users");
  }

  // NOTE: backend should return data.items and data.total
  return res.data.data;
}

/**
 * Fetch a single user by ID
 * GET /api/v1/user/:userId
 */
export async function fetchUserById(userId: string): Promise<BackendUser> {
  const url = `user/${encodeURIComponent(userId)}`;

  const res = await api.get<ApiEnvelope<BackendUser>>(url);

  if (!res.data || res.data.success === false) {
    throw new Error(res.data?.message || `Failed to fetch user ${userId}`);
  }

  return res.data.data;
}

/**
 * Toggle active flag for a user
 * PATCH /api/users/:id/toggle-active
 * returns updated user in envelope.data
 */
export async function toggleUserActive(id: string): Promise<BackendUser> {
  const res = await api.patch<ApiEnvelope<BackendUser>>(
    `/users/${encodeURIComponent(id)}/toggle-active`
  );

  if (!res.data || res.data.success === false) {
    throw new Error(res.data?.message || `Failed to toggle user ${id}`);
  }

  return res.data.data;
}

/**
 * Update wallet points by delta (attempt delta endpoint first)
 * PATCH /api/users/:id/wallet  { delta: number }
 * Fallback: PATCH /api/users/:id  { walletPoints: newValue } if delta endpoint not present
 */
export async function updateWalletPoints(
  id: string,
  delta: number
): Promise<BackendUser> {
  try {
    const res = await api.patch<ApiEnvelope<BackendUser>>(
      `/users/${encodeURIComponent(id)}/wallet`,
      { delta }
    );

    if (!res.data || res.data.success === false) {
      throw new Error(res.data?.message || `Failed to update wallet for ${id}`);
    }
    return res.data.data;
  } catch {
    // fallback to patching the user directly (server may expect absolute value)
    // Note: This fallback requires that backend accepts walletPoints as absolute value.
    const fallbackRes = await api.patch<ApiEnvelope<BackendUser>>(
      `/users/${encodeURIComponent(id)}`,
      { walletPoints: delta }
    );
    if (!fallbackRes.data || fallbackRes.data.success === false) {
      throw new Error(
        fallbackRes.data?.message ||
          `Failed to update wallet (fallback) for ${id}`
      );
    }
    return fallbackRes.data.data;
  }
}

/**
 * Create a new user
 * POST /api/users
 */
export async function createUser(
  payload: Omit<Partial<BackendUser>, "id" | "createdAt" | "updatedAt">
): Promise<BackendUser> {
  const res = await api.post<ApiEnvelope<BackendUser>>(`/users`, payload);

  if (!res.data || res.data.success === false) {
    throw new Error(res.data?.message || "Failed to create user");
  }

  return res.data.data;
}

/**
 * Delete user
 * DELETE /api/users/:id
 */
export async function deleteUser(id: string): Promise<void> {
  const res = await api.delete<ApiEnvelope<null>>(
    `/users/${encodeURIComponent(id)}`
  );

  if (!res.data || res.data.success === false) {
    throw new Error(res.data?.message || `Failed to delete user ${id}`);
  }
  return;
}

/**
 * Fetch user referrals
 * GET /api/v1/user/:userId/referrals
 */
export async function fetchUserReferrals(userId: string): Promise<Referral[]> {
  const url = `referrals/history/${encodeURIComponent(userId)}`;

  const res = await api.get<ApiEnvelope<Referral[]>>(url);

  if (!res.data || res.data.success === false) {
    throw new Error(
      res.data?.message || `Failed to fetch referrals for user ${userId}`
    );
  }

  return res.data.data;
}

/**
 * Fetch user referral stats
 * GET /api/v1/user/:userId/referral-stats
 */
export async function fetchUserReferralStats(
  userId: string
): Promise<ReferralStats> {
  const url = `referrals/stats/${encodeURIComponent(userId)}`;

  const res = await api.get<ApiEnvelope<ReferralStats>>(url);

  if (!res.data || res.data.success === false) {
    throw new Error(
      res.data?.message || `Failed to fetch referral stats for user ${userId}`
    );
  }

  return res.data.data;
}

/**
 * Wallet transaction interface
 */
export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type:
    | "deposit"
    | "withdrawal"
    | "contest_entry"
    | "contest_refund"
    | "contest_winnings"
    | "bonus"
    | "joining_bonus"
    | "referral"
    | "referral_bonus";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string | null;
  referenceType: string | null;
  status: "pending" | "completed" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch user wallet history
 * GET /api/wallet/history/:userId
 */
export async function fetchUserWalletHistory(
  userId: string
): Promise<WalletTransaction[]> {
  const url = `wallet/history/${encodeURIComponent(userId)}`;

  const res = await api.get<ApiEnvelope<WalletTransaction[]>>(url);

  if (!res.data || res.data.success === false) {
    throw new Error(
      res.data?.message || `Failed to fetch wallet history for user ${userId}`
    );
  }

  return res.data.data;
}

/**
 * Update user status
 * PATCH /api/admin/user/:userId/status
 */
export async function updateUserStatus(
  userId: string,
  status: "active" | "inactive" | "suspended" | "banned"
): Promise<BackendUser> {
  const url = `admin/user/${encodeURIComponent(userId)}/status`;

  const res = await api.patch<ApiEnvelope<BackendUser>>(url, { status });

  if (!res.data || res.data.success === false) {
    throw new Error(res.data?.message || `Failed to update user status`);
  }

  return res.data.data;
}

/**
 * Update auth status (temporary - uses user status endpoint)
 * PATCH /api/admin/user/:userId/status
 */
export async function updateAuthStatus(
  userId: string,
  status: "active" | "inactive" | "suspended" | "banned"
): Promise<BackendUser> {
  const url = `admin/auth/${encodeURIComponent(userId)}/status`;

  const res = await api.patch<ApiEnvelope<BackendUser>>(url, { status });

  if (!res.data || res.data.success === false) {
    throw new Error(res.data?.message || `Failed to update user status`);
  }

  return res.data.data;
}
