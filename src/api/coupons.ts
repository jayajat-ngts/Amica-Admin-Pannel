import { api } from "../utils/axios"; // your axios wrapper

export type CouponStatus = "active" | "expired" | "used" | "inactive";

export interface Coupon {
  id: string;
  code: string;
  title: string;
  platform: string; // allow any platform string
  discountType: "flat" | "percent";
  discountValue: number;
  purchaseAmount: number; // <-- renamed from minOrderValue
  expiry: string;
  status: CouponStatus;
  usageCount: number;
  maxUsePerUser?: number;
  createdAt?: string;
  updatedAt?: string;
  isRedeemed?: boolean; // for one-time redemption tracking
}

export interface UserCoupon {
  id: string;
  userId: string;
  couponId: string;
  redeemedAt: string;
  createdAt: string;
  updatedAt: string;
  coupon?: Coupon;
}

export interface CouponQuery {
  search?: string;
  status?: CouponStatus | "all";
  platform?: string | "all";
  page?: number;
  pageSize?: number;
}
export interface CreateCouponPayload {
  code: string;
  title: string;
  platform: Coupon["platform"];
  discountType: Coupon["discountType"];
  discountValue: number;
  purchaseAmount?: number;
  expiry: string; // ISO date string
  status: CouponStatus;
  maxUsePerUser?: number;
}

// Response envelope (same shape as your backend standard)
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: unknown;
  timestamp?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// ---------- API calls ----------

// List coupons with filters
export async function fetchCoupons(
  query: CouponQuery = {}
): Promise<{ items: Coupon[]; total: number }> {
  const res = await api.get<ApiEnvelope<{ items: Coupon[]; total: number }>>(
    "/coupons",
    { params: query }
  );

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to fetch coupons");
  }

  const items: Coupon[] = Array.isArray(res.data.data) ? res.data.data : [];
  const total = items.length;

  return { items, total };
}

/** ✅ Create coupon */
export async function createCoupon(
  payload: CreateCouponPayload
): Promise<Coupon> {
  try {
    const res = await api.post<ApiEnvelope<Coupon>>("/coupons", payload);
    const body = res.data;

    if (!body || !body.success) {
      const msg = "Failed to create coupon";
      throw new Error(msg);
    }

    if (!body.data) {
      throw new Error("Unexpected response from server");
    }

    return body.data;
  } catch (err: unknown) {
    console.log("Error creating coupon:", err);

    throw new Error( "Failed to create coupon");
  }
}

// Toggle coupon active/inactive
export async function toggleCouponActive(id: string): Promise<Coupon> {
  const res = await api.patch<ApiEnvelope<Coupon>>(`/coupons/${id}/toggle`);
  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to toggle coupon");
  }
  return res.data.data;
}

// Delete coupon
export async function deleteCoupon(id: string): Promise<void> {
  const res = await api.delete<ApiEnvelope<null>>(`/coupons/${id}`);
  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to delete coupon");
  }
}

// Redeem a coupon for a user (one-time use)
export async function redeemCoupon(userId: string, couponId: string): Promise<{ userCoupon: UserCoupon; coupon: Coupon }> {
  try {
    const res = await api.post<ApiEnvelope<{ userCoupon: UserCoupon; coupon: Coupon }>>(
      "/coupons/redeem",
      { userId, couponId }
    );
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to redeem coupon");
    }
    return res.data.data;
  } catch (error: any) {
    // Extract error message from axios error response
    const errorMessage = 
      error.response?.data?.message || 
      error.response?.data?.error ||
      error.message || 
      "Failed to redeem coupon";
    throw new Error(errorMessage);
  }
}

// Get available coupons (not yet redeemed)
export async function fetchAvailableCoupons(
  query: { limit?: number; offset?: number } = {}
): Promise<{ items: Coupon[]; total: number }> {
  const res = await api.get<ApiEnvelope<Coupon[]>>("/coupons/available/list", {
    params: query,
  });

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to fetch available coupons");
  }

  const items: Coupon[] = Array.isArray(res.data.data) ? res.data.data : [];
  const total = res.data.pagination?.total || items.length;

  return { items, total };
}

// Get user's redeemed coupons
export async function fetchUserRedeemedCoupons(userId: string): Promise<UserCoupon[]> {
  const res = await api.get<ApiEnvelope<UserCoupon[]>>(
    `/coupons/user/${userId}/redeemed`
  );
  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to fetch user redeemed coupons");
  }
  return Array.isArray(res.data.data) ? res.data.data : [];
}

// Get contest coupon assignments
export async function fetchContestCouponAssignments(
  contestId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ items: ContestCouponAssignment[]; total: number }> {
  const params = new URLSearchParams();
  if (contestId) params.set("contestId", contestId);
  params.set("limit", limit.toString());
  params.set("offset", offset.toString());

  const res = await api.get(`/coupons/contest-assignments?${params}`);
  const envelope = res.data as ApiEnvelope<ContestCouponAssignment[]>;
  
  return {
    items: envelope.data || [],
    total: envelope.data?.length || 0,
  };
}

export interface ContestCouponAssignment {
  id: string;
  contestId: string;
  matchId: string;
  userId: string | null;
  rank: number;
  assignedAt: Date | null;
  createdAt: Date;
  assignmentReason: string;
  coupon?: {
    id: string;
    code: string;
    title: string;
    discountType: string;
    discountValue: number;
    status: string;
  };
}
