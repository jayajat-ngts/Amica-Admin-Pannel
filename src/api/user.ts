import { api } from "../utils/axios";

/* ================= Types ================= */
export interface User {
  id: string;
  name: string;
  email: string;
}

/* ================= API ================= */
/**
 * GET /api/admin/users
 */
export const getUsersApi = async (
  page = 1,
  limit = 100
): Promise<User[]> => {
  const res = await api.get<{
    success: boolean;
    data: {
      users: User[];
    };
  }>(`/api/admin/users/?page=${page}&limit=${limit}`);

  if (!res.data?.success) {
    throw new Error("Failed to fetch users");
  }

  return res.data.data.users || [];
};
