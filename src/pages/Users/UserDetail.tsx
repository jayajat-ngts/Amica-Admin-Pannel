import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import { BackendUser, fetchUserById } from "../../api/users";
import UserContestsTable from "../../components/users/UserContestsTable";
import UserWalletHistory from "../../components/users/UserWalletHistory";
import UserReferralHistory from "../../components/users/UserReferralHistory";
import UserLeaderboardStats from "../../components/users/UserLeaderboardStats";
import StatusUpdateModal from "../../components/users/StatusUpdateModal";
import AuthStatusUpdateModal from "../../components/users/AuthStatusUpdateModal";

type Tab = "contests" | "wallet" | "referrals" | "leaderboard";

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("contests");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<BackendUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Status update modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  
  // Auth status update modal
  const [authStatusModalOpen, setAuthStatusModalOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      if (!userId) {
        navigate("/users");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userData = await fetchUserById(userId);
        setUser(userData);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("Failed to load user details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId, navigate]);

  const handleUpdateStatus = () => {
    setStatusModalOpen(true);
  };


  const handleStatusUpdated = async () => {
    // Reload user data to show updated status
    if (userId) {
      try {
        const userData = await fetchUserById(userId);
        setUser(userData);
      } catch (err) {
        console.error("Failed to reload user:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">{error ? "⚠️" : "👤"}</div>
          <p className="text-gray-900 dark:text-white text-xl font-semibold mb-2">
            {error ? "Error Loading User" : "User Not Found"}
          </p>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error || "The user you're looking for doesn't exist"}
          </p>
          <button
            onClick={() => navigate("/users")}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "contests", label: "Joined Contests", icon: "🏆" },
    { id: "wallet", label: "Wallet History", icon: "💰" },
    { id: "referrals", label: "Referrals", icon: "👥" },
    { id: "leaderboard", label: "Leaderboard Stats", icon: "📊" },
  ];

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle={`User: ${user.userName || user.email}`} />

      {/* User Profile Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="p-6 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.userName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.userName || user.name || "Unknown User"}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  {user.email && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      📧 {user.email}
                    </span>
                  )}
                  {user.phoneNumber && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      📱 {user.phoneNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">Wallet Balance</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {user.walletData?.balance?.toLocaleString() || 0}
                </div>
              </div>
            
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">Account Status</div>
                <div className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  user.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : user.status === 'inactive'
                    ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                    : user.status === 'suspended'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">User ID</div>
                <div className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {user.userId.slice(0, 8)}...
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
            <button
              onClick={handleUpdateStatus}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-sm hover:shadow-md transition-all duration-200"
            >
              ⚙️ Update User Status
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Provider:</span>
              <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">{user.authData.provider}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Type:</span>
              <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">{user.type}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Referral Code:</span>
              <span className="ml-2 font-mono font-semibold text-violet-600 dark:text-violet-400">{user.referralCode}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Last Login:</span>
              <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
                {user.authData.lastLoginAt ? new Date(user.authData.lastLoginAt).toLocaleDateString() : "Never"}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-violet-600 text-violet-600 dark:text-violet-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "contests" && <UserContestsTable userId={user.userId} />}
          {activeTab === "wallet" && <UserWalletHistory userId={user.userId} />}
          {activeTab === "referrals" && <UserReferralHistory userId={user.userId} referralCode={user.referralCode} />}
          {activeTab === "leaderboard" && <UserLeaderboardStats userId={user.userId} />}
        </div>
      </div>
      
      {/* Status Update Modal */}
      {user && (
        <StatusUpdateModal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          user={{
            userId: user.userId,
            userName: user.userName || user.email || 'Unknown User',
            status: user.status,
          }}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
      
      {/* Auth Status Update Modal */}
      {user && (
        <AuthStatusUpdateModal
          isOpen={authStatusModalOpen}
          onClose={() => setAuthStatusModalOpen(false)}
          user={{
            userId: user.userId,
            userName: user.userName || user.email || 'Unknown User',
            authStatus: user.authData.status,
          }}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
}
