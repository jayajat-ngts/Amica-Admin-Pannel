import { api } from "../utils/axios";
import { ApiEnvelope } from "./staff";

/* =========================
   Audit Log Types
========================= */

export interface AuditLog {
  _id: string;
  actor_id: string;
  actor_email: string;
  module: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, any>;
  ip: string;
  user_agent: string;
  createdAt: string;
}

/* =========================
   GET /api/admin/audit-logs
========================= */

export const getAuditLogsApi = async (): Promise<AuditLog[]> => {
  const res = await api.get<ApiEnvelope<{ logs: AuditLog[] }>>(
    "/api/admin/audit-logs"
  );

  if (!res.data?.success) {
    throw new Error(
      res.data?.message || "Failed to fetch audit logs"
    );
  }

  return res.data.data.logs;
};
