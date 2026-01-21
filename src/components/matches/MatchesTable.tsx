// src/components/matches/MatchesTable.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import {
  ApiMatch,
  MatchesQuery,
  MatchStatus,
  fetchMatches,
  generateContest,
  patchMatch,
  MatchesPagination,
  MatchFormat,
  fetchTournaments,
  TournamentRef,
} from "../../api/matches";
import { useNavigate } from "react-router";

type Status = "not_started" | "started" | "completed" | "abandoned" | "cancelled";
type Format = "all" | "t20" | "oneday" | "test" | string;

interface MatchUI {
  id: string;
  key: string;
  name: string;
  shortName?: string;
  tournament?: string;
  venue?: string;
  status: Status;
  format: Format;
  startTimeStr?: string;
  contestGenerated?: boolean;
  score?: string;
  _raw: ApiMatch;
}

/** Extra local UI state per match */
type MatchState = {
  showOnFrontend: boolean;
  generating: boolean;
  contestGenerated?: boolean;
};

const STORAGE_KEY = "wizplay_matches_state_v1";

const statusColorMap: Record<Status, "success" | "warning" | "error" | "info"> =
{
  not_started: "warning",
  started: "success",
  completed: "info",
  abandoned: "error",
  cancelled: "error",
};

/**
 * Props:
 *  - sport, initial limit, initial offset, filterDate
 */
export default function MatchesTable({
  sport = "cricket",
  limit: initialLimit = 10,
  offset = 0,
  filterDate,
}: {
  sport?: string;
  limit?: number;
  offset?: number;
  filterDate?: string;
}) {
  const [matches, setMatches] = useState<MatchUI[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // pagination can be object from backend
  const [pagination, setPagination] = useState<MatchesPagination | null>(null);
  const [pageOffset, setPageOffset] = useState<number>(offset);
  const [limit, setLimit] = useState<number>(initialLimit);

  // filters & search
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [format, setFormat] = useState<string>("all");
  // use the same union as backend type where possible
  const [status, setStatus] = useState<MatchStatus | "all">("all");
  const [selectedDate, setSelectedDate] = useState<string>(filterDate || "");
  const [tournament, setTournament] = useState<string>("all");
  const [tournaments, setTournaments] = useState<TournamentRef[]>([]);

  // id -> state
  const [state, setState] = useState<Record<string, MatchState>>({});

  const navigate = useNavigate();
  
  // Load saved state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // Fetch tournaments
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const data = await fetchTournaments();
        setTournaments(data);
      } catch (error) {
        console.error("Failed to load tournaments:", error);
      }
    };
    loadTournaments();
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  // Helpers to read/initialize a row's state
  const getRowState = (id: string): MatchState =>
    state[id] ?? {
      showOnFrontend: false,
      generating: false,
    };

  const updateRowState = (id: string, patch: Partial<MatchState>) =>
    setState((prev) => ({ ...prev, [id]: { ...getRowState(id), ...patch } }));

  // Reconcile server boolean flags into local state store.
  // When server provides showOnFrontend or contestGenerated we prefer server value.
  const reconcileRowStates = (serverMatches: ApiMatch[]) => {
    setState((prev) => {
      const next = { ...prev };
      for (const m of serverMatches) {
        if (!m || !m.id) continue;
        const existing = next[m.id];

        // Avoid `any` by reading as Record<string, unknown>
        const raw = m as unknown as Record<string, unknown>;
        const serverShow = Object.prototype.hasOwnProperty.call(
          raw,
          "showOnFrontend"
        )
          ? Boolean(raw["showOnFrontend"])
          : undefined;
        
        const serverContestGenerated = Object.prototype.hasOwnProperty.call(
          raw,
          "contestGenerated"
        )
          ? Boolean(raw["contestGenerated"])
          : undefined;

        if (existing) {
          next[m.id] = {
            ...existing,
            showOnFrontend:
              typeof serverShow !== "undefined"
                ? serverShow
                : existing.showOnFrontend,
            contestGenerated:
              typeof serverContestGenerated !== "undefined"
                ? serverContestGenerated
                : existing.contestGenerated,
            generating: existing.generating ?? false,
          };
        } else {
          next[m.id] = {
            showOnFrontend:
              typeof serverShow !== "undefined" ? serverShow : false,
            contestGenerated:
              typeof serverContestGenerated !== "undefined" ? serverContestGenerated : false,
            generating: false,
          };
        }
      }
      return next;
    });
  };

  const mapApiToUI = (m: ApiMatch): MatchUI => {
    const started = typeof m.startedAt === "number" ? m.startedAt : null;
    const startTimeStr =
      started != null
        ? new Date(started * 1000).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        : undefined;

    // tournament shape can vary; safe-access with unknown cast
    const raw = m as unknown as Record<string, unknown>;
    const tournaments = raw["tournaments"] as
      | Record<string, unknown>
      | undefined;


    return {
      id: m.id,
      key: m.key,
      name: m.name,
      shortName: m.shortName,
      tournament:
        (tournaments && (tournaments["name"] as string | undefined)) ??
        m.tournamentKey,
      venue: undefined,
      status: (m.status as Status) ?? "not_started",
      format: (m.format as Format) ?? "t20",
      startTimeStr,
      contestGenerated: Boolean(m?.contestGenerated),
      _raw: m,
    };
  };

  // Debounce search input (400ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Set initial date filter from prop
  useEffect(() => {
    if (filterDate) {
      setSelectedDate(filterDate);
    }
  }, [filterDate]);

  // whenever debouncedSearch / filters / limit change reset pageOffset
  useEffect(() => {
    setPageOffset(0);
  }, [debouncedSearch, format, status, selectedDate, limit, tournament]);

  const loadMatches = useCallback(
    async (lim = limit, off = pageOffset) => {
      setLoading(true);
      setError(null);
      try {
        // Use MatchesQuery type from API
        const q: MatchesQuery = {
          sport,
          limit: lim,
          offset: off,
        };

        if (debouncedSearch) q.search = debouncedSearch;

        // Narrow status only if not "all"
        if (status && status !== "all") {
          q.status = status as MatchStatus;
        }

        if (format && format !== "all") q.format = format as MatchFormat;
        
        // Tournament filter
        if (tournament && tournament !== "all") {
          q.tournamentKey = tournament;
        }
        
        // Server-side date filtering (if backend supports it)
        if (selectedDate) {
          q.date = selectedDate;
        }

        const res = await fetchMatches(q);
        const items = (res.items ?? []).map(mapApiToUI);

        console.log("Fetched matches", items);

        setMatches(items);
        setPagination(res.pagination ?? 0);

        // reconcile server flags so server wins for showOnFrontend/subscribed
        if (Array.isArray(res.items) && res.items.length > 0) {
          reconcileRowStates(res.items);
        }
      } catch (err: unknown) {
        console.error("loadMatches error", err);
        setError("Failed to load matches");
      } finally {
        setLoading(false);
      }
    },
    [sport, limit, pageOffset, debouncedSearch, status, format, selectedDate, tournament]
  );

  // initial + on deps change
  useEffect(() => {
    loadMatches(limit, pageOffset);
  }, [loadMatches, limit, pageOffset]);

  // Actions (use API helpers)
  const handleGenerate = async (id: string) => {
    const row = getRowState(id);
    if (row.generating) return;
    updateRowState(id, { generating: true });

    try {
      // find match in current UI state
      const localMatch = matches.find((m) => m.id === id);
      if (!localMatch) throw new Error("Match not found in local state");

      // use provider raw payload if available
      const matchDataToSend = localMatch._raw ?? localMatch;

      // call backend with the full matchData
      await generateContest(matchDataToSend);

      // mark generation finished and update contestGenerated flag
      updateRowState(id, { generating: false, showOnFrontend: true, contestGenerated: true });

      // Update the match in the UI to show it as generated
      setMatches((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, contestGenerated: true } : p
        )
      );
      updateRowState(id, { generating: false });

      console.log(`Contest generated successfully for match ${id}`);
    } catch (err) {
      console.error("handleGenerate error", err);
      updateRowState(id, { generating: false });
    }
  };

  const handleToggleShow = async (id: string) => {
    const row = getRowState(id);
    const next = !row.showOnFrontend;
    // optimistic update locally
    updateRowState(id, { showOnFrontend: next });

    try {
      const patched = (await patchMatch(id, { showOnFrontend: next })) as
        | ApiMatch
        | Record<string, unknown>
        | undefined;

      // if backend returned updated match (either as object or wrapped), reconcile it
      const returnedMatch =
        patched && (patched as ApiMatch).id
          ? (patched as ApiMatch)
          : patched && (patched as Record<string, unknown>)["match"]
            ? ((patched as Record<string, unknown>)["match"] as ApiMatch)
            : undefined;

      if (returnedMatch) {
        reconcileRowStates([returnedMatch]);
      } else {
        // otherwise trust optimistic update (already applied)
        updateRowState(id, { showOnFrontend: next });
      }
    } catch (err) {
      console.error("handleToggleShow error", err);
      // rollback on failure
      updateRowState(id, { showOnFrontend: !next });
    }
  };

  // pagination controls
  const goNext = () => {
    if (!pagination) return;
    // pagination typing unknown -> use runtime guards
    const hasNext = !!(pagination as unknown as Record<string, unknown>)[
      "hasNext"
    ];
    if (!hasNext) return;
    const limitVal = Number(
      (pagination as unknown as Record<string, unknown>)["limit"] ?? limit
    );
    const nextOffset = pageOffset + limitVal;
    setPageOffset(nextOffset);
  };

  const goPrev = () => {
    if (!pagination) return;
    const hasPrev = !!(pagination as unknown as Record<string, unknown>)[
      "hasPrev"
    ];
    if (!hasPrev) return;
    const limitVal = Number(
      (pagination as unknown as Record<string, unknown>)["limit"] ?? limit
    );
    const prevOffset = Math.max(0, pageOffset - limitVal);
    setPageOffset(prevOffset);
  };

  const clearFilters = () => {
    setSearch("");
    setFormat("all");
    setStatus("all");
    setSelectedDate("");
    setTournament("all");
  };

  // options for dropdowns
  const formatOptions = useMemo(
    () => [
      { value: "all", label: "All Formats" },
      { value: "t20", label: "T20" },
      { value: "oneday", label: "One Day" },
      { value: "test", label: "Test" },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All Status" },
      { value: "not_started", label: "Not Started" },
      { value: "started", label: "Started" },
      { value: "completed", label: "Completed" },
      { value: "abandoned", label: "Abandoned" },
      { value: "cancelled", label: "Cancelled" },
    ],
    []
  );

  const tournamentOptions = useMemo(
    () => [
      { value: "all", label: "All Tournaments" },
      ...tournaments.map((t) => ({
        value: t.key,
        label: t.name || t.shortName ,
      })),
    ],
    [tournaments]
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Filters Section */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name/tournament/venue..."
              className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500"
              aria-label="Search matches"
            />
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {search && (
              <button
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

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Filter */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white min-w-[140px]"
              aria-label="Filter by date"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Clear date"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Format Filter */}
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="h-9 border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white min-w-[140px]"
            aria-label="Filter by format"
          >
            {formatOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MatchStatus | "all")}
            className="h-9 border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white min-w-[140px]"
            aria-label="Filter by status"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Tournament Filter */}
          <select
            value={tournament}
            onChange={(e) => setTournament(e.target.value)}
            className="h-9 border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white min-w-[160px]"
            aria-label="Filter by tournament"
          >
            {tournamentOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Clear Filters Button */}
          <button
            onClick={clearFilters}
            disabled={loading}
            className="h-9 px-4 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:bg-gray-800 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Match
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Start Time
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {error && (
              <TableRow>
                <TableCell className="px-5 py-6" colSpan={7}>
                  <div className="text-red-600 dark:text-red-400">Error: {error}</div>
                </TableCell>
              </TableRow>
            )}

            {!loading && matches.length === 0 && !error && (
              <TableRow>
                <TableCell className="px-5 py-6" colSpan={7}>
                  <div className="text-gray-500 dark:text-gray-400">No matches found</div>
                </TableCell>
              </TableRow>
            )}

            {matches.map((match) => {
              const row = getRowState(match.id);

              return (
                <TableRow key={match.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start max-w-xs">
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {match.name} ({match.shortName ?? "—"})
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {match.tournament ?? "—"} •{" "}
                        {String(match.format).toUpperCase()}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="px-3 min-w-[120px] py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Badge size="sm" color={statusColorMap[match.status]}>
                        {match.status
                          .replace("_", " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {match.startTimeStr ?? "—"}
                  </TableCell>

                  <TableCell className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          !row.contestGenerated
                            ? handleGenerate(match.id)
                            : undefined
                        }
                        disabled={row.generating || row.contestGenerated}
                        className="px-3 py-1 rounded-md bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {row.generating
                          ? "Generating..."
                          : row.contestGenerated
                            ? "✅ Generated"
                            : "🤖 Generate"}
                      </button>

                      <button
                        onClick={() => handleToggleShow(match.id)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${row.showOnFrontend
                            ? "px-3 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 text-xs"
                            : "bg-red-50 px-3 py-1 text-xs text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300"
                          }`}
                      >
                        {row.showOnFrontend ? "👁️ Visible" : "🚫 Hidden"}
                      </button>
                      <button
                        onClick={() => navigate(`/live-score/${match.key}`)}
                        className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/[0.05] text-xs"
                      >
                        Scorecard
                      </button>
                      <button
                        onClick={() => navigate(`/contest/${match.id}`)}
                        className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/[0.05] text-xs"
                      >
                        View Contest
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        {/* Left: Results info and page size selector */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {pagination
              ? `Page ${Number(
                (pagination as MatchesPagination).page ?? 1
              )} of ${Number(
                (pagination as MatchesPagination).totalPages ?? 1
              )} • ${Number(
                (pagination as MatchesPagination).total ?? 0
              )} result${Number((pagination as MatchesPagination).total ?? 0) !== 1 ? 's' : ''}`
              : loading
                ? "Loading..."
                : ""}
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Per page:
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Right: Navigation buttons */}
        <div className="flex gap-2">
          <button
            onClick={goPrev}
            disabled={loading || !(pagination && pagination.hasPrev)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition"
          >
            ← Previous
          </button>

          <button
            onClick={goNext}
            disabled={loading || !(pagination && pagination.hasNext)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
