import React, { useEffect, useState, useMemo } from "react";
import { Modal } from "../ui/modal";
import { redeemCoupon, UserCoupon, Coupon, fetchCoupons } from "../../api/coupons";
import { fetchUsers, BackendUser } from "../../api/users";

type Props = {
  isOpen: boolean;
  closeModal: () => void;
  onRedeemed?: (result: { userCoupon: UserCoupon; coupon: Coupon }) => void;
};

export default function RedeemCouponModal({
  isOpen,
  closeModal,
  onRedeemed,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [userId, setUserId] = useState("");
  const [couponId, setCouponId] = useState("");

  // Dropdown states
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [couponSearch, setCouponSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCouponDropdown, setShowCouponDropdown] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponTab, setCouponTab] = useState<"all" | "available">("available");

  // Selected items for display
  const [selectedUser, setSelectedUser] = useState<BackendUser | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Filtered search results
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users.slice(0, 10); // Show first 10 by default
    return users.filter(user =>
      user.userName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.phoneNumber?.includes(userSearch)
    ).slice(0, 10);
  }, [users, userSearch]);

  const filteredCoupons = useMemo(() => {
    // First filter by tab selection
    let tabFiltered = coupons;
    if (couponTab === "available") {
      // Available coupons are those not redeemed yet
      tabFiltered = coupons.filter(coupon => !coupon.isRedeemed && coupon.status === "active");
    }

    // Then apply search filter
    if (!couponSearch.trim()) return tabFiltered.slice(0, 10);
    return tabFiltered.filter(coupon =>
      coupon.code.toLowerCase().includes(couponSearch.toLowerCase()) ||
      coupon.title.toLowerCase().includes(couponSearch.toLowerCase())
    ).slice(0, 10);
  }, [coupons, couponSearch, couponTab]);

  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      setErrorMessage(null);
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    // Load users
    setLoadingUsers(true);
    try {
      const usersData = await fetchUsers({});
      setUsers(usersData.items || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }

    // Load coupons (all statuses for filtering)
    setLoadingCoupons(true);
    try {
      const couponsData = await fetchCoupons({});
      setCoupons(couponsData.items || []);
    } catch (err) {
      console.error("Failed to load coupons:", err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const resetForm = () => {
    setUserId("");
    setCouponId("");
    setUserSearch("");
    setCouponSearch("");
    setSelectedUser(null);
    setSelectedCoupon(null);
    setShowUserDropdown(false);
    setShowCouponDropdown(false);
    setMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    if (!userId.trim()) {
      setErrorMessage("Please select a user");
      return;
    }

    if (!couponId.trim()) {
      setErrorMessage("Please select a coupon");
      return;
    }

    try {
      setBusy(true);
      const result = await redeemCoupon(userId.trim(), couponId.trim());
      setMessage(`Coupon "${result.coupon.code}" redeemed successfully!`);
      if (onRedeemed) onRedeemed(result);
      setBusy(false);

      setTimeout(() => {
        closeModal();
        resetForm();
      }, 1500);
    } catch (err: unknown) {
      console.error("redeemCoupon error", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to redeem coupon";
      setErrorMessage(errorMsg);
      setBusy(false);
      // Keep error message visible longer (6 seconds)
      setTimeout(() => {
        setErrorMessage(null);
      }, 6000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        resetForm();
      }}
      className="max-w-[500px] p-6 lg:p-10"
    >
      {/* Backdrop to close dropdowns */}
      {(showUserDropdown || showCouponDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserDropdown(false);
            setShowCouponDropdown(false);
          }}
        />
      )}

      <div className="flex flex-col px-2">
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            Redeem Coupon
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redeem a coupon for a user. This is a one-time action and cannot be undone.
          </p>
        </div>

        {message && (
          <div className="mt-4 rounded-md bg-green-50 px-3 py-2 text-green-800">
            {message}
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-red-800">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              User
            </label>
            <div className="relative">
              <input
                value={selectedUser ? (selectedUser.userName || selectedUser.email || "") : userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setSelectedUser(null);
                  setUserId("");
                  setShowUserDropdown(true);
                }}
                onFocus={() => setShowUserDropdown(true)}
                placeholder="Search users by name, email, or phone"
                className="w-full mt-1 border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white pr-8"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {showUserDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {loadingUsers ? (
                  <div className="p-3 text-center text-gray-500">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-3 text-center text-gray-500">No users found</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.userId}
                      onClick={() => {
                        setSelectedUser(user);
                        setUserId(user.userId);
                        setUserSearch("");
                        setShowUserDropdown(false);
                      }}
                      className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.userName || "No username"}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email} {user.phoneNumber && `• ${user.phoneNumber}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <p className="mt-1 text-xs text-gray-500">
              Search and select a user to redeem the coupon for
            </p>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Coupon
            </label>
            <div className="relative">
              <input
                value={selectedCoupon ? `${selectedCoupon.code} - ${selectedCoupon.title}` : couponSearch}
                onChange={(e) => {
                  setCouponSearch(e.target.value);
                  setSelectedCoupon(null);
                  setCouponId("");
                  setShowCouponDropdown(true);
                }}
                onFocus={() => setShowCouponDropdown(true)}
                placeholder="Search coupons by code or title"
                className="w-full mt-1 border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white pr-8"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {showCouponDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-hidden">
                {/* Tab Header */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <button
                    type="button"
                    onClick={() => setCouponTab("available")}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition ${couponTab === "available"
                        ? "text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 bg-white dark:bg-gray-800"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                  >
                    Available Coupons
                  </button>
                  <button
                    type="button"
                    onClick={() => setCouponTab("all")}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition ${couponTab === "all"
                        ? "text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 bg-white dark:bg-gray-800"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                  >
                    All Coupons
                  </button>
                </div>

                {/* Dropdown Content */}
                <div className="max-h-60 overflow-y-auto">
                  {loadingCoupons ? (
                    <div className="p-3 text-center text-gray-500">Loading coupons...</div>
                  ) : filteredCoupons.length === 0 ? (
                    <div className="p-3 text-center text-gray-500">
                      {couponTab === "available" ? "No available coupons found" : "No coupons found"}
                    </div>
                  ) : (
                    filteredCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        onClick={() => {
                          setSelectedCoupon(coupon);
                          setCouponId(coupon.id);
                          setCouponSearch("");
                          setShowCouponDropdown(false);
                        }}
                        className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {coupon.code}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {coupon.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {coupon.discountType === 'flat' ? '$' : ''}{coupon.discountValue}{coupon.discountType === 'percent' ? '%' : ''} off
                              {coupon.platform && ` • ${coupon.platform}`}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {coupon.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <p className="mt-1 text-xs text-gray-500">
              Search and select an active coupon to redeem
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mt-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Warning:</strong> Once a coupon is redeemed, it will be marked as "used"
              and will no longer be available for other users. This action is permanent.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-6 justify-end">
            <button
              type="button"
              onClick={() => {
                closeModal();
                resetForm();
              }}
              className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              onClick={handleSubmit}
              className="flex justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {busy ? "Redeeming..." : "Redeem Coupon"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
