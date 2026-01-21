import { api } from "../utils/axios";

/* =========================
   Common Types
========================= */

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

/* =========================
   Staff Types
========================= */

export interface CreateStaffPayload {
  name: string;
  email: string;
  mobile_no: string;
  password: string;
roles: string[];
  notes?: string;    // ✅ optional

}
export interface StaffRole {
  _id: string;
  name: string;
  is_active: boolean;
}


export interface Staff {
  id: string;
  name: string;
  email: string;
  roles: StaffRole[];   // ✅ array of objects
  status: "active" | "inactive";
  is_root: boolean;     // ✅ missing before
  notes?: string | null;
 mobile_no: string | null;   // ✅ ADD
}
/* =========================
   Role Types
========================= */

export interface Role {
  id: string;
  name: string;

  description?: string;
  permissions: string[];
  is_active: boolean;
  createdAt?: string;
}


/* =========================
   Permission Types
========================= */

export interface Permission {
  _id: string;
  key: string;
  module: string;
  action: string;
  description: string;
}

export interface UpdateRoleStatusPayload {
  is_active: boolean;
}
export interface UpdateStaffStatusPayload {
  status: "active" | "disabled";
}



/* =========================
   API Calls
========================= */

/**
 * POST /api/admin/staff
 * Create staff
 */
export const createStaffApi = async (
  payload: CreateStaffPayload
): Promise<Staff> => {
  const res = await api.post<ApiEnvelope<Staff>>(
    "/api/admin/create",
    payload
  );

  if (!res.data?.success) {
    throw new Error(res.data?.message || "Failed to create staff");
  }

  return res.data.data;
};

/**
 * GET /api/admin/roles
 * Get all roles
 */
export const getRolesApi = async (): Promise<Role[]> => {
  const res = await api.get<ApiEnvelope<Role[]>>(
    "/api/admin/roles"
  );

  if (!res.data?.success) {
    throw new Error(res.data?.message || "Failed to fetch roles");
  }

  return res.data.data;
};


/**
 * POST /api/admin/roles
 * Create role (WITH permissions)
 */
export interface CreateRolePayload {
  name: string;
 
  permissions: string[]; // ✅ REQUIRED by backend
}

export const createRoleApi = async (
  payload: CreateRolePayload
): Promise<Role> => {
  const res = await api.post<ApiEnvelope<Role>>(
    "/api/admin/roles",
    payload
  );

  if (!res.data?.success) {
    throw new Error(res.data?.message || "Failed to create role");
  }

  return res.data.data;
};

/**
 * GET /api/admin/permissions
 * Get all permissions
 */
export const getPermissionsApi = async (): Promise<Permission[]> => {
  const res = await api.get<ApiEnvelope<Permission[]>>(
    "/api/admin/permission" // ✅ FIXED (plural)
  );

  if (!res.data?.success) {
    throw new Error(res.data?.message || "Failed to fetch permissions");
  }

  return res.data.data;
};
export const updateRoleStatusApi = async (
  roleId: string,
  payload: UpdateRoleStatusPayload
): Promise<Role> => {
  const res = await api.patch<ApiEnvelope<Role>>(
    `/api/admin/roles/${roleId}/status`,
    payload
  );

  if (!res.data?.success) {
    throw new Error(res.data?.message || "Failed to update role status");
  }

  return res.data.data;
};
/**
 * GET /api/admin/staff
 * Get all staff
 */
export const getStaffApi = async (): Promise<Staff[]> => {
  const res = await api.get<ApiEnvelope<Staff[]>>(
    "/api/admin/staff"
  );

  if (!res.data?.success) {
    throw new Error(res.data?.message || "Failed to fetch staff");
  }

  return res.data.data;
};

/**
 * PATCH /api/admin/staff/:id/status
 * Update staff status (active / inactive)
 */
export const updateStaffStatusApi = async (
  staffId: string,
  payload: UpdateStaffStatusPayload
): Promise<Staff> => {
  const res = await api.patch<ApiEnvelope<Staff>>(
    `/api/admin/staff/${staffId}/status`,
    payload
  );

  if (!res.data?.success) {
    throw new Error(
      res.data?.message || "Failed to update staff status"
    );
  }

  return res.data.data;
};
