import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import {
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import MetricCard from "../../components/dashboard/MetricCard";
import { getDashboardAnalytics, DashboardAnalytics } from "../../api/dashboard";

export default function Home() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        console.log("[Dashboard] Fetching analytics...");
        console.log("[Dashboard] API Base URL:", import.meta.env.VITE_API_BASE_URL);
        
        // Check if user is authenticated
        const authState = localStorage.getItem('auth_state_v1') || sessionStorage.getItem('auth_state_v1');
        if (authState) {
          const parsed = JSON.parse(authState);
          console.log("[Dashboard] Auth token present:", !!parsed.token);
          console.log("[Dashboard] User type:", parsed.user?.type);
        } else {
          console.warn("[Dashboard] No auth state found in storage!");
        }
        
        const data = await getDashboardAnalytics();
        console.log("[Dashboard] Analytics data received:", data);
        setAnalytics(data);
        setError(null);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string }; status?: number }; message?: string };
        console.error("[Dashboard] Failed to fetch dashboard analytics:", error);
        console.error("[Dashboard] Error response:", error.response?.data);
        console.error("[Dashboard] Error status:", error.response?.status);
        
        let errorMsg = "Failed to load dashboard data";
        if (error.response?.status === 401) {
          errorMsg = "Unauthorized: Please login as an admin user";
        } else if (error.response?.data?.message) {
          errorMsg = error.response.data.message;
        } else if (error.message) {
          errorMsg = error.message;
        }
        
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <>
        <PageMeta
          title="Wizplay Dashboard | Admin Overview"
          description="Track users, contests, matches, wallets, and revenue on the Wizplay admin dashboard."
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !analytics) {
    return (
      <>
        <PageMeta
          title="Wizplay Dashboard | Admin Overview"
          description="Track users, contests, matches, wallets, and revenue on the Wizplay admin dashboard."
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="max-w-2xl p-6 text-center bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
              Error Loading Dashboard
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error || "Failed to load dashboard data"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please check the browser console for more details or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Wizplay Dashboard | Admin Overview"
        description="Track users, contests, matches, wallets, and revenue on the Wizplay admin dashboard."
      />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Users Metrics */}
        <div className="col-span-12">
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
            Users
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 md:gap-6">
            <MetricCard
              title="Total Users"
              value={analytics.users.total.toLocaleString()}
              icon={
                <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={
                analytics.users.newToday > 0 ? (
                  <>
                    <ArrowUpIcon /> {analytics.users.newToday} today
                  </>
                ) : (
                  <></>
                )
              }
              positive
            />

            <MetricCard
              title="Active Users"
              value={analytics.users.active.toLocaleString()}
              icon={
                <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={<></>}
              positive
            />

            <MetricCard
              title="New This Week"
              value={analytics.users.newThisWeek.toLocaleString()}
              icon={
                <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={<></>}
              positive
            />

            <MetricCard
              title="New This Month"
              value={analytics.users.newThisMonth.toLocaleString()}
              icon={
                <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={<></>}
              positive
            />

            <MetricCard
              title="Regular Users"
              value={analytics.users.byType.user.toLocaleString()}
              icon={
                <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={<></>}
              positive
            />
          </div>
        </div>

        {/* Matches Metrics */}
        <div className="col-span-12">
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
            Matches
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
            <MetricCard
              title="Total Matches"
              value={analytics.matches.total.toLocaleString()}
              icon={
                <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={<></>}
              positive
            />

            <MetricCard
              title="Upcoming Matches"
              value={analytics.matches.upcoming.toLocaleString()}
              icon={
                <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={<></>}
              positive
            />

            <MetricCard
              title="Live Matches"
              value={analytics.matches.live.toLocaleString()}
              icon={
                <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={
                analytics.matches.live > 0 ? (
                  <>
                    <ArrowUpIcon /> Live Now
                  </>
                ) : (
                  <></>
                )
              }
              positive
            />

            <MetricCard
              title="Completed Matches"
              value={analytics.matches.completed.toLocaleString()}
              icon={
                <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={<></>}
              positive
            />
          </div>
        </div>

        {/* Contests Metrics */}
        <div className="col-span-12">
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
            Contests
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 md:gap-6">
            <MetricCard
              title="Total Contests"
              value={analytics.contests.total.toLocaleString()}
              icon={
                <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={<></>}
              positive
            />

            <MetricCard
              title="Scheduled"
              value={analytics.contests.scheduled.toLocaleString()}
              icon={
                <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={<></>}
              positive
            />

            <MetricCard
              title="Running"
              value={analytics.contests.running.toLocaleString()}
              icon={
                <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={
                analytics.contests.running > 0 ? (
                  <>
                    <ArrowUpIcon /> Active
                  </>
                ) : (
                  <></>
                )
              }
              positive
            />

            <MetricCard
              title="Total Participants"
              value={analytics.contests.totalParticipants.toLocaleString()}
              icon={
                <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={<></>}
              positive
            />
          </div>
        </div>

        {/* Coupons Metrics */}
        <div className="col-span-12">
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
            Coupons
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 md:gap-6">
            <MetricCard
              title="Total Coupons"
              value={analytics.coupons.total.toLocaleString()}
              icon={
                <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={<></>}
              positive
            />

            <MetricCard
              title="Active Coupons"
              value={analytics.coupons.active.toLocaleString()}
              icon={
                <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={<></>}
              positive
            />

            <MetricCard
              title="Redeemed Coupons"
              value={analytics.coupons.redeemed.toLocaleString()}
              icon={
                <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={<></>}
              positive
            />

            <MetricCard
              title="Expired Coupons"
              value={analytics.coupons.expired.toLocaleString()}
              icon={
                <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={<></>}
              positive
            />

            <MetricCard
              title="Total Value"
              value={`₹${analytics.coupons.totalValue.toLocaleString()}`}
              icon={
                <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
              }
              change={<></>}
              positive
            />
          </div>
        </div>
      </div>
    </>
  );
}
