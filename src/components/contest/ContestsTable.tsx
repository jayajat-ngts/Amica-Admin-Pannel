// src/components/contests/ContestsTable.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Contest,
  ContestQuery,
  fetchContests,
  deleteContest,
  patchContest,
  fetchContestLeaderboard,
  fetchUserContestAnswers,
  LeaderboardEntry,
  LeaderboardResponse,
} from "../../api/contests";
import { useNavigate } from "react-router";
import { Modal } from "../ui/modal";

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

export default function ContestsTable({ matchId }: { matchId?: string }) {
  // filters & pagination (limit/offset)
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [offset, setOffset] = useState<number>(0);
  const [limit] = useState<number>(10);
  const [data, setData] = useState<Contest[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [busyRow, setBusyRow] = useState<string | null>(null);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<LeaderboardEntry | null>(null);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [prizeModalOpen, setPrizeModalOpen] = useState(false);
  const [selectedPrizeContest, setSelectedPrizeContest] = useState<Contest | null>(null);

  // Get match info from first contest
  const matchInfo = data[0]?.matchData;

  const navigate = useNavigate();
  const debounceMs = 500;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const currentPage = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);

  // data loader (memoized)
  const load = useCallback(
    async (opts?: { resetOffset?: boolean }) => {
      try {
        if (opts?.resetOffset) setOffset(0);
        setLoading(true);
        setErr(null);

        const q: ContestQuery = {
          search: debouncedSearch?.trim() || undefined,
          limit,
          offset,
          matchId: matchId || undefined,
        };

        // Define the expected response type
        interface ContestsApiResponse {
          items: Contest[];
          total: number;
        }

        const res = (await fetchContests(q)) as ContestsApiResponse;
        const items = Array.isArray(res.items) ? res.items : [];
        const totalCount =
          typeof res.total === "number" ? res.total : items.length;

        setData(items);

        setTotal(totalCount);
      } catch (e: unknown) {
        console.error("fetchContests error:", e);
        setErr("Failed to load contests");
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, offset, limit, matchId]
  );

  // Debounce search input -> update debouncedSearch
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setOffset(0);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search]);

  // fetch whenever debouncedSearch, offset, limit, or load changes
  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contest?")) return;

    // if current page has only one item and it's being deleted and offset > 0 -> go to previous page (offset - limit)
    const willGoPrev = data.length === 1 && offset > 0;
    const nextOffset = willGoPrev ? Math.max(0, offset - limit) : offset;

    try {
      setBusyRow(id);
      await deleteContest(id);

      // update offset first if needed, then reload
      if (willGoPrev) setOffset(nextOffset);

      // reload (load depends on offset via useCallback)
      await load();
    } catch (e) {
      console.error("delete error", e);
      setErr("Failed to delete contest");
    } finally {
      setBusyRow(null);
    }
  };

  const handleToggleVisibility = async (id: string, currentValue: boolean) => {
    try {
      setBusyRow(id);
      await patchContest(id, { displayEnabled: !currentValue });
      await load();
    } catch (e) {
      console.error("toggle visibility error", e);
      setErr("Failed to update visibility");
    } finally {
      setBusyRow(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Contest["status"]) => {
    try {
      setBusyRow(id);
      await patchContest(id, { status: newStatus });
      await load();
    } catch (e) {
      console.error("status change error", e);
      setErr("Failed to update status");
    } finally {
      setBusyRow(null);
    }
  };

  const handleViewParticipants = async (contest: Contest) => {
    try {
      setSelectedContest(contest);
      setLeaderboardModalOpen(true);
      setLoadingLeaderboard(true);
      setSelectedUserId(null);
      setUserAnswers(null);
      const res = await fetchContestLeaderboard(contest.id);
      setLeaderboardData(res);
    } catch (e) {
      console.error("fetch leaderboard error", e);
      setLeaderboardData(null);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleViewUserAnswers = async (userId: string) => {
    if (!selectedContest) return;
    try {
      setSelectedUserId(userId);
      setLoadingAnswers(true);
      const res = await fetchUserContestAnswers(selectedContest.id, userId);
      setUserAnswers(res);
    } catch (e) {
      console.error("fetch user answers error", e);
      setUserAnswers(null);
    } finally {
      setLoadingAnswers(false);
    }
  };

  const closeLeaderboardModal = () => {
    setLeaderboardModalOpen(false);
    setSelectedContest(null);
    setLeaderboardData(null);
    setSelectedUserId(null);
    setUserAnswers(null);
  };

  const handleViewPrizes = (contest: Contest) => {
    setSelectedPrizeContest(contest);
    setPrizeModalOpen(true);
  };

  const closePrizeModal = () => {
    setPrizeModalOpen(false);
    setSelectedPrizeContest(null);
  };

  const goPrev = () => {
    if (loading || offset <= 0) return;
    setOffset((o) => Math.max(0, o - limit));
  };

  const goNext = () => {
    if (loading) return;
    if (offset + limit >= total) return;
    setOffset((o) => o + limit);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Match Info Header */}
      {matchId && matchInfo && (
        <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Left: Match Info */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Match Contests
              </h3>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Teams */}
                <div className="flex items-center gap-2">
                  {matchInfo.teams?.a?.flag_url && (
                    <img
                      src={matchInfo.teams.a.flag_url}
                      alt={matchInfo.teams.a.code}
                      className="w-5 h-4 object-cover rounded-sm"
                    />
                  )}
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {matchInfo.teams?.a?.code || 'TBD'}
                  </span>
                  <span className="text-xs text-gray-400">vs</span>
                  {matchInfo.teams?.b?.flag_url && (
                    <img
                      src={matchInfo.teams.b.flag_url}
                      alt={matchInfo.teams.b.code}
                      className="w-5 h-4 object-cover rounded-sm"
                    />
                  )}
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {matchInfo.teams?.b?.code || 'TBD'}
                  </span>
                </div>

                {/* Tournament */}
                {matchInfo.tournaments?.shortName && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {matchInfo.tournaments.shortName}
                  </span>
                )}

                {/* Match Status */}
                {matchInfo.status && (
                  <span className={`text-xs px-2 py-1 rounded-full ${matchInfo.status === 'completed'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : matchInfo.status === 'running' || matchInfo.status === 'live'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                    {matchInfo.status}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Contest Stats */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Contests</div>
                <div className="text-lg font-bold text-violet-600 dark:text-violet-400">
                  {total}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gray-50 dark:bg-gray-900/50">
        {/* Left side: search */}
        <div className="flex-1 md:flex-none w-full md:w-auto">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 md:flex-none md:w-80">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name/matchId/platform…"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                aria-label="Search contests"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right side: create contest */}
        <div className="flex-shrink-0">
          <button
            onClick={() => navigate("/contest/create")}
            className="h-10 rounded-lg bg-violet-600 px-5 text-sm font-medium text-white hover:bg-violet-700 active:bg-violet-800 transition shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Contest
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
              >
                Name / Match
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
              >
                Entry Fee
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
              >
                Prize Pool
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
              >
                Participants
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400 text-left"
              >
                Visibility
              </TableCell>

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
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {err && (
              <TableRow>
                <TableCell
                  className="px-5 py-4 text-sm text-red-600"
                  colSpan={7}
                >
                  {err}
                </TableCell>
              </TableRow>
            )}

            {/* Render rows */}
            {(() => {
              if (loading) {
                return Array.from({ length: 4 }).map((_, i) => (
                  <LoadingRow key={i} />
                ));
              }
              if (data.length === 0) {
                return (
                  <TableRow>
                    <TableCell className="px-5 py-6 text-gray-500" colSpan={7}>
                      No contests found
                    </TableCell>
                  </TableRow>
                );
              }
              return data.map((c) => {
                const isBusy = busyRow === c.id;

                const entryFee =
                  typeof c.entryFee === "number" ? c.entryFee : 0;
                const prizePool =
                  typeof c.prizePool === "number" ? c.prizePool : 0;
                const filledSpots = typeof c.filledSpots === "number" ? c.filledSpots : 0;
                const totalSpots = typeof c.totalSpots === "number" ? c.totalSpots : 0;

                return (
                  <TableRow key={c.id}>
                    <TableCell className="px-5 py-4 text-left">
                      <div className="flex flex-col items-start gap-2">
                        {/* Contest Title */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs rounded-md bg-gray-100 px-2 py-0.5 font-semibold tracking-wide text-gray-800 dark:bg-white/10 dark:text-gray-200">
                            {c.title}
                          </span>
                        </div>

                        {/* Match Info */}
                        {c.matchData ? (
                          <div className="flex flex-col gap-1">
                            {/* Teams with Flags */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                {c.matchData.teams?.a?.flag_url && (
                                  <img
                                    src={c.matchData.teams.a.flag_url}
                                    alt={c.matchData.teams.a.code}
                                    className="w-4 h-4 object-cover rounded-lg"
                                  />
                                )}
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {c.matchData.teams?.a?.code || 'TBD'}
                                </span>
                              </div>

                              <span className="text-xs text-gray-400">vs</span>

                              <div className="flex items-center gap-1.5">
                                {c.matchData.teams?.b?.flag_url && (
                                  <img
                                    src={c.matchData.teams.b.flag_url}
                                    alt={c.matchData.teams.b.code}
                                    className="w-4 h-4 object-cover rounded-lg"
                                  />
                                )}
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {c.matchData.teams?.b?.code || 'TBD'}
                                </span>
                              </div>
                            </div>

                            {/* Tournament & Status */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {c.matchData.tournaments?.shortName && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {c.matchData.tournaments.shortName}
                                </span>
                              )}
                              {c.matchData.status && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${c.matchData.status === 'completed'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : c.matchData.status === 'live'
                                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  }`}>
                                  {c.matchData.status}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Match: {c.matchId ?? "—"}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 text-left">
                      {entryFee === 0 ? "Free" : `${entryFee} points`}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 text-left">
                      {prizePool} points
                    </TableCell>

                    <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 text-left">
                      <div className="flex items-center gap-2">
                        <span>{filledSpots} / {totalSpots}</span>

                      </div>
                    </TableCell>

                    <TableCell className="px-5 py-4 text-left">
                      <button
                        disabled={isBusy}
                        onClick={() => handleToggleVisibility(c.id, c.displayEnabled ?? false)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${c.displayEnabled
                            ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                            : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300"
                          } ${isBusy ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        {c.displayEnabled ? "Visible" : "Hidden"}
                      </button>
                    </TableCell>

                    <TableCell className="px-5 py-4 text-left">
                      <select
                        disabled={isBusy}
                        value={c.status || "upcoming"}
                        onChange={(e) => handleStatusChange(c.id, e.target.value as Contest["status"])}
                        className={`px-3 py-1 rounded-md text-xs font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 ${isBusy ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="joining_closed">Joining Closed</option>
                        <option value="live">Live</option>
                        <option value="calculating">Calculating</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </TableCell>

                    <TableCell className="px-5 py-4 text-center">
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={() => navigate(`/questions/${c.id}`)}
                          className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/[0.05] text-xs"
                        >
                          Questions
                        </button>
                        <button
                          onClick={() => handleViewParticipants(c)}
                          className="px-3 py-1 rounded-md bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50 text-xs"
                        >
                          Leaderboard
                        </button>
                        <button
                          onClick={() => handleViewPrizes(c)}
                          className="px-3 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 text-xs"
                        >
                          Prizes
                        </button>
                        <button
                          disabled={isBusy}
                          onClick={() => handleDelete(c.id)}
                          className={`rounded-md bg-red-50 px-3 py-1 text-xs text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 ${isBusy ? "opacity-60 cursor-not-allowed" : ""
                            }`}
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              });
            })()}
          </TableBody>
        </Table>
      </div>

      {/* Leaderboard Modal with improved UI */}
      <Modal
        isOpen={leaderboardModalOpen}
        onClose={closeLeaderboardModal}
        className="max-w-[1200px] p-0"
      >
        <div className="flex flex-col h-[80vh]">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  🏆 Contest Leaderboard
                </h5>
                {leaderboardData && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {leaderboardData.contestTitle} • {leaderboardData.totalParticipants} participant{leaderboardData.totalParticipants !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <button
                onClick={closeLeaderboardModal}
                className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800 transition"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Left: Leaderboard List */}
            <div className={`${selectedUserId ? 'w-1/2 border-r border-gray-200 dark:border-gray-700' : 'w-full'} overflow-y-auto`}>
              {loadingLeaderboard ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading leaderboard...</p>
                  </div>
                </div>
              ) : !leaderboardData || leaderboardData.leaderboard.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No participants yet</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {leaderboardData.leaderboard.map((entry, index) => {
                    const isTop3 = index < 3;
                    const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                    const isSelected = selectedUserId === entry.userId;

                    return (
                      <div
                        key={entry.userId}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer ${isSelected ? 'bg-violet-50 dark:bg-violet-900/20 border-l-4 border-violet-600' : ''
                          } ${isTop3 ? 'bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-900/10' : ''}`}
                        onClick={() => handleViewUserAnswers(entry.userId)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${isTop3
                              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}>
                            {medalEmoji || `#${entry.rank}`}
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h6 className="font-semibold text-gray-900 dark:text-white truncate">
                                {entry.userName || `User ${entry.userId.slice(0, 8)}`}
                              </h6>
                              {isTop3 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                  Top {index + 1}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                              {entry.userEmail && (
                                <span className="truncate">📧 {entry.userEmail}</span>
                              )}
                              {entry.userPhone && (
                                <span>📱 {entry.userPhone}</span>
                              )}
                            </div>
                            {entry.correctAnswers !== undefined && entry.totalAnswers !== undefined && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full transition-all"
                                    style={{ width: `${(entry.correctAnswers / entry.totalAnswers) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  {entry.correctAnswers}/{entry.totalAnswers}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Score */}
                          <div className="text-right flex-shrink-0">
                            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                              {entry.totalScore}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              points
                              {entry.maxScore && (
                                <span className="ml-1">/ {entry.maxScore}</span>
                              )}
                            </div>
                            {entry.percentage !== undefined && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {entry.percentage.toFixed(1)}%
                              </div>
                            )}
                          </div>

                          {/* Arrow indicator */}
                          {selectedUserId === entry.userId && (
                            <svg className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: User Answers Details */}
            {selectedUserId && (
              <div className="w-1/2 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                {loadingAnswers ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent mb-4"></div>
                      <p className="text-gray-500 dark:text-gray-400">Loading answers...</p>
                    </div>
                  </div>
                ) : userAnswers ? (
                  <div className="p-6">
                    {/* User Summary */}
                    <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <h6 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                        {userAnswers.userName || 'User Details'}
                      </h6>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Score</div>
                          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{userAnswers.totalScore}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rank</div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">#{userAnswers.rank}</div>
                        </div>
                        {userAnswers.maxScore && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Max Score</div>
                            <div className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                              {userAnswers.maxScore}
                            </div>
                          </div>
                        )}
                        {userAnswers.percentage !== undefined && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Percentage</div>
                            <div className="text-xl font-semibold text-green-600 dark:text-green-400">
                              {userAnswers.percentage.toFixed(1)}%
                            </div>
                          </div>
                        )}
                        {userAnswers.correctAnswers !== undefined && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Correct</div>
                            <div className="text-xl font-semibold text-green-600 dark:text-green-400">
                              {userAnswers.correctAnswers}
                            </div>
                          </div>
                        )}
                        {userAnswers.totalAnswers !== undefined && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</div>
                            <div className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                              {userAnswers.totalAnswers}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Answers List */}
                    <div className="space-y-3">
                      <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Answers Breakdown
                      </h6>
                      {userAnswers.answers && userAnswers.answers.length > 0 ? (
                        userAnswers.answers.map((answer, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border-2 transition ${answer.ansKey && answer.isCorrect
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-700'
                              }`}
                          >
                            <div className="flex items-start gap-3 mb-2">
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${answer.isCorrect
                                  ? 'bg-green-500 text-white'
                                  : 'bg-red-500 text-white'
                                }`}>
                                { answer.ansKey ? answer.isCorrect ? '✓' : '✗' : '–'}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                  Q{idx + 1}: {answer.question || `Question ${answer.questionId}`}
                                </p>
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 dark:text-gray-400">User Answer:</span>
                                    <span className={`font-semibold ${answer.isCorrect
                                        ? 'text-green-700 dark:text-green-300'
                                        : 'text-red-700 dark:text-red-300'
                                      }`}>
                                      {answer.selectedKey || 'No Answer'}
                                    </span>
                                  </div>
                                  {!answer.isCorrect && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-600 dark:text-gray-400">Correct Answer:</span>
                                      <span className="font-semibold text-green-700 dark:text-green-300">
                                        {answer.ansKey}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 dark:text-gray-400">Points:</span>
                                    <span className="font-semibold text-violet-600 dark:text-violet-400">
                                      +{answer.earnedPoints}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No answer details available
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    Failed to load user answers
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedUserId ? 'Click on another user to view their answers' : 'Click on any user to view their detailed answers'}
              </div>
              <button
                onClick={closeLeaderboardModal}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Prize Distribution Modal */}
      <Modal
        isOpen={prizeModalOpen}
        onClose={closePrizeModal}
        className="max-w-[900px] p-0"
      >
        <div className="flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  💰 Prize Distribution
                </h5>
                {selectedPrizeContest && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedPrizeContest.title}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Total Pool:</span>
                        <span className="ml-2 font-bold text-green-600 dark:text-green-400">
                          {selectedPrizeContest.prizePool?.toLocaleString() || 0} points
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Entry Fee:</span>
                        <span className="ml-2 font-semibold text-gray-700 dark:text-gray-300">
                          {selectedPrizeContest.entryFee === 0 ? 'Free' : `${selectedPrizeContest.entryFee} points`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* <button
                onClick={closePrizeModal}
                className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800 transition"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button> */}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedPrizeContest?.rankRanges && selectedPrizeContest.rankRanges.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-semibold text-sm text-gray-700 dark:text-gray-300">
                  <div>Rank</div>
                  <div className="text-right">Winners</div>
                  <div className="text-right">Prize/Winner</div>
                  <div className="text-right">Total Payout</div>
                </div>

                {selectedPrizeContest.rankRanges.map((range, index) => {
                  const isTop3 = range.from <= 3;
                  const winnerCount = range.to - range.from + 1;

                  return (
                    <div
                      key={index}
                      className={`grid grid-cols-4 gap-4 px-4 py-3 rounded-lg transition ${isTop3
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-4 border-yellow-500'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {range.from === 1 && <span className="text-xl">🥇</span>}
                        {range.from === 2 && <span className="text-xl">🥈</span>}
                        {range.from === 3 && <span className="text-xl">🥉</span>}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {range.from === range.to ? `#${range.from}` : `#${range.from} - #${range.to}`}
                        </span>
                      </div>

                      <div className="text-right text-gray-600 dark:text-gray-400">
                        {winnerCount} {winnerCount === 1 ? 'winner' : 'winners'}
                      </div>

                      <div className="text-right font-semibold text-green-600 dark:text-green-400">
                        {range.amount.toLocaleString()} pts
                      </div>

                      <div className="text-right font-bold text-gray-900 dark:text-white">
                        {range.totalPayout.toLocaleString()} pts
                      </div>
                    </div>
                  );
                })}

                {/* Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg border-2 border-violet-200 dark:border-violet-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Distributed</div>
                      <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                        {selectedPrizeContest.prizeBreakdown?.totalAssigned?.toLocaleString() || 0} points
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Winners</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedPrizeContest.rankRanges[selectedPrizeContest.rankRanges.length - 1]?.to || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedPrizeContest?.prizeBreakdown?.perRank && selectedPrizeContest.prizeBreakdown.perRank.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-semibold text-sm text-gray-700 dark:text-gray-300">
                  <div>Rank</div>
                  <div className="text-right">Prize</div>
                  <div className="text-right">Total</div>
                </div>

                {selectedPrizeContest.prizeBreakdown.perRank.slice(0, 50).map((prize, index) => {
                  const isTop3 = prize.rank <= 3;

                  return (
                    <div
                      key={index}
                      className={`grid grid-cols-3 gap-4 px-4 py-3 rounded-lg transition ${isTop3
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-4 border-yellow-500'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {prize.rank === 1 && <span className="text-xl">🥇</span>}
                        {prize.rank === 2 && <span className="text-xl">🥈</span>}
                        {prize.rank === 3 && <span className="text-xl">🥉</span>}
                        <span className="font-medium text-gray-900 dark:text-white">
                          #{prize.rank}
                        </span>
                      </div>

                      <div className="text-right font-semibold text-green-600 dark:text-green-400">
                        {prize.amount.toLocaleString()} pts
                      </div>

                      <div className="text-right font-bold text-gray-900 dark:text-white">
                        {prize.amount.toLocaleString()} pts
                      </div>
                    </div>
                  );
                })}

                {selectedPrizeContest.prizeBreakdown.perRank.length > 50 && (
                  <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    ... and {selectedPrizeContest.prizeBreakdown.perRank.length - 50} more ranks
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💰</div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  No prize distribution available
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Prize distribution is based on final rankings
              </div>
              <button
                onClick={closePrizeModal}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Pagination */}
      <div className="p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          Page {currentPage} of {totalPages} • {total} result{total !== 1 ? 's' : ''}
        </div>

        <div className="flex gap-2">
          <button
            onClick={goPrev}
            disabled={loading || offset <= 0}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition"
          >
            ← Previous
          </button>

          <button
            onClick={goNext}
            disabled={loading || offset + limit >= total}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
