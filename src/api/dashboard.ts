import { api } from "../utils/axios";
import { ApiEnvelope } from "./auth";

export interface DashboardAnalytics {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    byType: {
      user: number;
      admin: number;
    };
  };
  contests: {
    total: number;
    scheduled: number;
    running: number;
    completed: number;
    totalParticipants: number;
  };
  matches: {
    total: number;
    upcoming: number;
    live: number;
    completed: number;
  };
  coupons: {
    total: number;
    active: number;
    redeemed: number;
    expired: number;
    totalValue: number;
  };
  wallets: {
    totalBalance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalWinnings: number;
    activeWallets: number;
  };
  transactions: {
    totalToday: number;
    totalThisWeek: number;
    totalThisMonth: number;
    volumeToday: number;
    volumeThisWeek: number;
    volumeThisMonth: number;
  };
  revenue: {
    totalEntryFees: number;
    totalPayouts: number;
    netRevenue: number;
  };
}

/**
 * Fetch dashboard analytics data
 * @returns Dashboard analytics with users, contests, matches, wallets, transactions, and revenue data
 */
export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const response = await api.get<ApiEnvelope<DashboardAnalytics>>(
    "/admin/analytics/dashboard"
  );
  return response.data.data;
}
