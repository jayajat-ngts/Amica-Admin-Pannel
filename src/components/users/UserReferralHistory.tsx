import { useEffect, useState } from "react";
import { fetchUserReferrals, fetchUserReferralStats, Referral, ReferralStats } from "../../api/users";

interface UserReferralHistoryProps {
  userId: string;
  referralCode: string;
}

export default function UserReferralHistory({ userId, referralCode }: UserReferralHistoryProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadReferralData = async () => {
      try {
        setLoading(true);

        // Fetch both referrals and stats in parallel
        const [referralsData, statsData] = await Promise.all([
          fetchUserReferrals(userId),
          fetchUserReferralStats(userId)
        ]);

        setReferrals(referralsData);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to fetch referral data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReferralData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent"></div>
      </div>
    );
  }

  const totalBonus = stats?.totalBonusEarned || referrals.reduce((sum: number, r: Referral) => sum + r.bonusEarned, 0);
  const activeReferrals = stats?.activeReferrals || referrals.filter((r: Referral) => r.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Referral Code Card */}
      <div className="p-6 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-2 border-violet-200 dark:border-violet-800">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Referral Code</div>
          <div className="text-3xl font-bold font-mono text-violet-600 dark:text-violet-400 mb-4">
            {referralCode}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(referralCode);
              alert("Referral code copied!");
            }}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 text-sm font-medium transition"
          >
            📋 Copy Code
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-700 dark:text-green-400 mb-1">Total Referrals</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {referrals.length}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-700 dark:text-blue-400 mb-1">Active Referrals</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {activeReferrals}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
          <div className="text-sm text-violet-700 dark:text-violet-400 mb-1">Total Bonus Earned</div>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {totalBonus.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Referrals List */}
      {referrals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">No referrals yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Share your referral code to earn bonuses!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((referral) => (
            <div
              key={referral.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/30 hover:shadow-md transition"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* User Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                    {(referral.referredUserName || referral.referredUserEmail || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {referral.referredUserName || 'Anonymous User'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {referral.referredUserEmail || '-'}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${referral.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : referral.status === "registered"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                      >
                        {referral.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Joined {new Date(referral.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bonus & Activity */}
                <div className="flex gap-4 items-center">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Bonus Earned</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      +{referral.bonusEarned}
                    </div>
                  </div>
                  {referral.lastActiveAt && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Last Active</div>
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        {new Date(referral.lastActiveAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Referral Info */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div className="flex-1 text-sm text-blue-900 dark:text-blue-300">
            <div className="font-semibold mb-1">Referral Program Benefits:</div>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-400">
              <li>Earn 100 points when your friend registers</li>
              <li>Earn additional 100 points when they join their first contest</li>
              <li>Your friend also gets a welcome bonus!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
