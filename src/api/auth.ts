import { api } from "../utils/axios";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: unknown;
  timestamp?: string;
}

export interface BackendUser {
  id: string;
  userId: string;
  email: string;
  phoneNumber: string | null;
  provider: "email" | string;
  password: string | null;
  otpCode: string | null;
  lastLoginAt: string | null;
  onboarded: boolean;
  otpExpiresAt: string | null;
  type: "admin" | "user" | string;
  status: "active" | "inactive" | "suspended" | "banned";
  createdAt: string;
  updatedAt: string;
}

export interface BackendLoginData {
  token: string;
  user: BackendUser;
}

/** Frontend-friendly (flattened) output your UI already expects */
export interface LoginResponse {
  token: string;
  user: BackendUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordEnvelope {
  success: boolean;
  message?: string;
  // optionally: errors?: unknown; timestamp?: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  email: string;
}

export interface ResetPasswordEnvelope {
  success: boolean;
  message?: string;
  // errors?: unknown; timestamp?: string;
}
// export const loginApi = async (
//   payload: LoginPayload
// ): Promise<LoginResponse> => {
//   const res = await api.post<ApiEnvelope<BackendLoginData>>(
//     "/api/admin/login",
//     payload
//   );

//   const body = res.data;

//   if (!body?.success || !body.data?.token) {
//     throw new Error(body?.message || "Login failed");
//   }

//   return {
//     token: body.data.token,
//     user: body.data.user,
//   };
// };

export const loginApi = async (
  payload: LoginPayload
): Promise<LoginResponse> => {
  const res = await api.post<ApiEnvelope<BackendLoginData>>(
    "/api/admin/auth/login",
    payload
  );

  const body = res.data;

  if (!body?.success || !body.data?.token) {
    throw new Error(body?.message || "Login failed");
  }

  const { token, user } = body.data;

  // ✅ Store token in localStorage
  localStorage.setItem("auth_token", token);

  // (Optional) store user info
  localStorage.setItem("auth_user", JSON.stringify(user));

  return {
    token,
    user,
  };
};

export const requestPasswordReset = async (
  payload: ForgotPasswordPayload
): Promise<{ message?: string; success?: boolean }> => {
  // Adjust URL to your backend route
  const res = await api.post<ForgotPasswordEnvelope>("/auth/forget", payload);
  return { message: res.data?.message, success: res.data?.success };
};

export const resetPasswordApi = async (
  payload: ResetPasswordPayload
): Promise<{ message?: string }> => {
  // Adjust path to your backend
  const res = await api.patch<ResetPasswordEnvelope>(
    "/auth/reset",
    payload
  );
  if (!res.data?.success) {
    throw new Error(res.data?.message || "Unable to reset password");
  }
  return { message: res.data?.message };
};

/**
 * Update auth status
 * PATCH /api/admin/auth/:userId/status
 */
export const updateAuthStatus = async (
  userId: string,
  status: "active" | "inactive" | "suspended" | "banned"
): Promise<BackendUser> => {
  const url = `/admin/auth/${encodeURIComponent(userId)}/status`;
  
  const res = await api.patch<ApiEnvelope<BackendUser>>(url, { status });
  
  if (!res.data || res.data.success === false) {
    throw new Error(res.data?.message || "Failed to update auth status");
  }
  
  return res.data.data;
};
