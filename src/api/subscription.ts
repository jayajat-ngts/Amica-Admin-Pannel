// api/subscription.ts
import { api } from "../utils/axios";
// types/subscription.ts

export interface SubscriptionPlan {
  _id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: "INR";
  duration_days: number;
  limits: {
    max_messages_per_day: number;
  };
  features: {
    can_export_history?: boolean;
    priority_support?: boolean;
  };
  is_active: boolean;
  is_system_plan: boolean;
  createdAt: string;
}

/* ================= Payloads ================= */

export interface CreatePlanPayload {
  name: string;
  description?: string | null;
  price: number;
  duration_days: number;
  limits: {
    max_messages_per_day: number;
  };
  features?: {
    can_export_history?: boolean;
    priority_support?: boolean;
  };
}

/* ================= API CALLS ================= */

/**
 * POST /api/admin/plans
 * Create subscription plan
 */
export const createPlanApi = async (
  payload: CreatePlanPayload
): Promise<SubscriptionPlan> => {
  const res = await api.post("/api/admin/plans", payload);

  if (!res.data?.success) {
    throw new Error(res.data?.message || "Failed to create plan");
  }

  return res.data.data;
};

/**
 * GET /api/admin/plans
 * Get all plans
 */
export const getPlansApi = async (): Promise<SubscriptionPlan[]> => {
  const res = await api.get("/api/admin/plans");

  if (!res.data?.success) {
    throw new Error("Failed to fetch plans");
  }

  return res.data.data;
};

/**
 * PATCH /api/admin/plans/:id
 * Update plan
 */
export const updatePlanApi = async (
  planId: string,
  payload: Partial<CreatePlanPayload>
): Promise<SubscriptionPlan> => {
  const res = await api.patch(`/api/admin/plans/${planId}`, payload);

  if (!res.data?.success) {
    throw new Error("Failed to update plan");
  }

  return res.data.data;
};

/**
 * PATCH /api/admin/plans/:id/status
 * Enable / Disable plan
 */
export const updatePlanStatusApi = async (
  planId: string,
  is_active: boolean
) => {
  const res = await api.patch(`/api/admin/plans/${planId}/status`, {
    is_active,
  });

  if (!res.data?.success) {
    throw new Error("Failed to update plan status");
  }

  return res.data.data;
};

export const getSubscriptionPlansApi = async (): Promise<SubscriptionPlan[]> => {
  const res = await api.get("/api/admin/subscription-plans");
  return res.data.data;
};

export const createSubscriptionPlanApi = async (
  payload: Partial<SubscriptionPlan>
) => {
  const res = await api.post("/api/admin/subscription-plans", payload);
  return res.data.data;
};

export const updateSubscriptionPlanApi = async (
  id: string,
  payload: Partial<SubscriptionPlan>
) => {
  const res = await api.patch(
    `/api/admin/subscription-plans/${id}`,
    payload
  );
  return res.data.data;
};

export const toggleSubscriptionStatusApi = async (
  id: string,
  is_active: boolean
) => {
  const res = await api.patch(
    `/api/admin/subscription-plans/${id}/status`,
    { is_active }
  );
  return res.data.data;
};
