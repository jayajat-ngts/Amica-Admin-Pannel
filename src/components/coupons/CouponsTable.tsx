// src/components/coupons/CouponsTable.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import {
  Coupon,
  CouponQuery,
  fetchCoupons,
  deleteCoupon,
  fetchContestCouponAssignments,
  ContestCouponAssignment,
} from "../../api/coupons";
import CreateCouponModal from "./CreateCouponModal";
import RedeemCouponModal from "./RedeemCouponModal";
import { useModal } from "../../hooks/useModal"; // if you want shared hook instance

/** Map status -> badge color & label */
function StatusBadge({ status, isRedeemed }: { status: Coupon["status"]; isRedeemed?: boolean }) {
  // If coupon is redeemed (one-time use), show as "Redeemed" regardless of status
  if (isRedeemed) {
    return (
      <Badge size="sm" color="warning">
        Redeemed
      </Badge>
    );
  }
  
  const map =
    status === "active"
      ? { color: "success" as const, label: "Active" }
      : status === "expired"
      ? { color: "error" as const, label: "Expired" }
      : status === "used"
      ? { color: "warning" as const, label: "Used" }
      : { color: "error" as const, label: "Inactive" };

  return (
    <Badge size="sm" color={map.color}>
      {map.label}
    </Badge>
  );
}

function LoadingRow() {
  return (
    <TableRow>
      <TableCell className="px-5 py-5">
        <div className="animate-pulse h-4 bg-gray-200 dark:bg-white/10 rounded w-1/2 mb-3" />
        <div className="animate-pulse h-4 bg-gray-200 dark:bg-white/10 rounded w-2/3" />
      </TableCell>
    </TableRow>
  );
}

export default function CouponsTable() {
  // filters & pagination
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [data, setData] = useState<Coupon[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [busyRow, setBusyRow] = useState<string | null>(null);
  const [copiedRow, setCopiedRow] = useState<string | null>(null);
  const [couponTab, setCouponTab] = useState<"all" | "available" | "assignments">("available");
  
  // State for contest assignments
  const [assignmentData, setAssignmentData] = useState<ContestCouponAssignment[]>([]);
  const [assignmentTotal, setAssignmentTotal] = useState<number>(0);
  const [assignmentPage, setAssignmentPage] = useState<number>(1);
  const [assignmentLoading, setAssignmentLoading] = useState<boolean>(false);
  const [assignmentErr, setAssignmentErr] = useState<string | null>(null);

  const { isOpen, openModal, closeModal } = useModal(); // same hook used inside modal works if hook provides shared context
  const { isOpen: isRedeemOpen, openModal: openRedeemModal, closeModal: closeRedeemModal } = useModal();

  const debounceMs = 500;
  const debounceRef = useRef<number | undefined>(undefined);

  const totalPages = useMemo(() => {
    if (couponTab === "assignments") {
      return Math.max(1, Math.ceil(assignmentTotal / pageSize));
    }
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, assignmentTotal, pageSize, couponTab]);

  // Filter data based on tab selection
  const displayData = useMemo(() => {
    if (couponTab === "available") {
      return data.filter(coupon => !coupon.isRedeemed && coupon.status === "active");
    }
    return data;
  }, [data, couponTab]);

  // load function (uses debouncedSearch as the search term)
  const load = async (opts?: { resetPage?: boolean }) => {
    try {
      if (opts?.resetPage) setPage(1);
      setLoading(true);
      setErr(null);

      const q: CouponQuery = {
        search: debouncedSearch?.trim() || undefined,
        page,
        pageSize,
      };

      const res = await fetchCoupons(q);
      setData(Array.isArray(res.items) ? res.items : []);
      setTotal(
        typeof res.total === "number" ? res.total : (res.items ?? []).length
      );
    } catch (e: unknown) {
      console.error("fetchCoupons error:", e);
      setErr("Failed to load coupons");
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Load assignment data
  const loadAssignments = async (opts?: { resetPage?: boolean }) => {
    try {
      if (opts?.resetPage) setAssignmentPage(1);
      setAssignmentLoading(true);
      setAssignmentErr(null);

      const res = await fetchContestCouponAssignments(
        undefined, // contestId - could be added as a filter later
        pageSize,
        (assignmentPage - 1) * pageSize
      );
      
      setAssignmentData(Array.isArray(res.items) ? res.items : []);
      setAssignmentTotal(
        typeof res.total === "number" ? res.total : (res.items ?? []).length
      );
    } catch (e: unknown) {
      console.error("fetchContestCouponAssignments error:", e);
      setAssignmentErr("Failed to load contest assignments");
      setAssignmentData([]);
      setAssignmentTotal(0);
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Debounce search input -> update debouncedSearch
  useEffect(() => {
    // clear existing debounce
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      // when search changes, we reset page to 1
      setDebouncedSearch(search.trim());
      setPage(1);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [search]);

  // fetch whenever debouncedSearch, platform, status, or page changes
  useEffect(() => {
    if (couponTab === "assignments") {
      loadAssignments();
    } else {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page, assignmentPage, couponTab]);

  // When platform or status change, reset to page 1 immediately

  const copyCode = async (code: string, couponId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedRow(couponId);
      window.setTimeout(() => setCopiedRow(null), 1400);
    } catch {
      // Could show error state if needed, for now just clear
      setCopiedRow(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      setBusyRow(id);
      await deleteCoupon(id);
      // reload after delete; if last item on page deleted, adjust page
      await load();
      if (data.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (e) {
      console.error("delete error", e);
      setErr("Failed to delete coupon");
    } finally {
      setBusyRow(null);
    }
  };

  const goPrev = () => {
    if (page <= 1) return;
    setPage((p) => p - 1);
  };

  const goNext = () => {
    if (page >= totalPages) return;
    setPage((p) => p + 1);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Toolbar */}
      <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left side: search + filters */}
        <div className="flex-1 md:flex-none w-full md:w-auto">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 md:flex-none">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code/title/platform…"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Right side: create coupon */}
        <div className="flex-shrink-0 flex gap-2">
          <button
            onClick={() => {
              openRedeemModal();
            }}
            className="h-10 rounded-lg bg-orange-600 px-4 text-sm font-medium text-white hover:bg-orange-700"
          >
            Redeem Coupon
          </button>
          
          <button
            onClick={() => {
              openModal();
            }}
            className="h-10 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-700"
          >
            + Create Coupon
          </button>

          <CreateCouponModal
            isOpen={isOpen}
            openModal={openModal}
            closeModal={closeModal}
            onCreated={async () => {
              // refresh table after create
              setPage(1);
              await load({ resetPage: true });
            }}
          />

          <RedeemCouponModal
            isOpen={isRedeemOpen}
            closeModal={closeRedeemModal}
            onRedeemed={async () => {
              // refresh table after redemption
              await load();
            }}
          />
        </div>
      </div>

      {/* Tab Header */}
      <div className="flex border-b border-gray-200 dark:border-white/[0.05] bg-gray-50 dark:bg-white/[0.02]">
          <button
          type="button"
          onClick={() => setCouponTab("available")}
          className={`px-6 py-3 text-sm font-medium transition relative ${
            couponTab === "available"
              ? "text-violet-600 dark:text-violet-400 bg-white dark:bg-white/[0.03]"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          Available Coupons
          {couponTab === "available" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400" />
          )}
        </button>
        
        <button
          type="button"
          onClick={() => setCouponTab("all")}
          className={`px-6 py-3 text-sm font-medium transition relative ${
            couponTab === "all"
              ? "text-violet-600 dark:text-violet-400 bg-white dark:bg-white/[0.03]"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          All Coupons
          {couponTab === "all" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setCouponTab("assignments")}
          className={`px-6 py-3 text-sm font-medium transition relative ${
            couponTab === "assignments"
              ? "text-violet-600 dark:text-violet-400 bg-white dark:bg-white/[0.03]"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          Contest Assignments
          {couponTab === "assignments" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400" />
          )}
        </button>
      
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {couponTab === "assignments" ? (
                // Headers for assignments table
                <>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
                  >
                    Coupon Code
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
                  >
                    Contest
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
                  >
                    Rank
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
                  >
                    Winner
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
                  >
                    Assigned Date
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
                  >
                    Discount
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
                  >
                    Reason
                  </TableCell>
                </>
              ) : (
                // Headers for coupons table
                <>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
                  >
                    Code
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
                  >
                    Platform
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
                  >
                    Discount
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
                  >
                    Purchase Amount
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
                  >
                    Expiry
                  </TableCell>
                </>
              )}
              <TableCell
                isHeader
                className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
              >
                Redemption
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {err && (
              <TableRow>
                <TableCell
                  className="px-5 py-4 text-sm text-red-600"
                  colSpan={8}
                >
                  {err}
                </TableCell>
              </TableRow>
            )}

            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <LoadingRow key={i} />)
            ) : displayData.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-6 text-gray-500" colSpan={8}>
                  {couponTab === "available" ? "No available coupons found" : "No coupons found"}
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((c) => {
                const isBusy = busyRow === c.id;
                const discountText =
                  c.discountType === "flat"
                    ? `${c.discountValue}`
                    : `${c.discountValue}%`;

                // expiry safe parsing
                let expStr = "—";
                if (c.expiry) {
                  const exp = new Date(c.expiry);
                  if (!Number.isNaN(exp.getTime())) {
                    expStr = exp.toLocaleString(undefined, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });
                  }
                }

                // purchaseAmount fallback to minOrderValue for backwards compatibility
                const purchaseAmount = c.purchaseAmount ?? 0;

                return (
                  <TableRow key={c.id}>
                    <TableCell className="px-5 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold tracking-wide text-gray-800 dark:bg-white/10 dark:text-gray-200">
                            {c.code}
                          </span>
                          <button
                            onClick={() => copyCode(c.code, c.id)}
                            className="text-xs text-brand-600 hover:underline dark:text-brand-400"
                          >
                            Copy
                          </button>
                          {copiedRow === c.id && (
                            <span className="ml-2 text-xs text-green-600">
                              Copied!
                            </span>
                          )}
                        </div>
                        {/* <span className="mt-1 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {c.title}
                        </span> */}
                      </div>
                    </TableCell>

                    <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400">
                      {c.platform ?? "—"}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400">
                      {discountText}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400">
                      {purchaseAmount} Pts
                    </TableCell>

                    <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400">
                      {expStr}
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <StatusBadge status={c.status} isRedeemed={c.isRedeemed} />
                    </TableCell>

                    <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400">
                      {c.isRedeemed || c.status === "used" ? (
                        <span className="text-orange-600 dark:text-orange-400 font-medium">One-time use</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 font-medium">Available</span>
                      )}
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {/* <button
                          disabled={isBusy}
                          onClick={() => handleToggle(c.id)}
                          className={`rounded-md px-3 py-1 text-xs font-medium ${
                            c.status === "active"
                              ? "border border-gray-300 text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/10"
                              : "bg-violet-600 text-white hover:bg-violet-700"
                          } ${isBusy ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          {c.status === "active" ? "Deactivate" : "Activate"}
                        </button> */}

                        <button
                          disabled={isBusy}
                          onClick={() => handleDelete(c.id)}
                          className={`rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 ${
                            isBusy ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="p-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Page {page} of {totalPages} • {displayData.length} of {total} results
          {couponTab === "available" && " (filtered)"}
        </div>

        <div>
          <button
            onClick={goPrev}
            disabled={loading || page <= 1}
            className="px-3 py-1 rounded-md mr-2 border disabled:opacity-50"
          >
            Prev
          </button>

          <button
            onClick={goNext}
            disabled={loading || page >= totalPages}
            className="px-3 py-1 rounded-md border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
