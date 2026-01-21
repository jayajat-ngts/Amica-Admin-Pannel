// src/api/contests.ts
import { api } from "../utils/axios";

export type ContestStatus =
  | "scheduled"
  | "running"
  | "completed"
  | "cancelled"
  | string;

export interface MatchTeam {
  key: string;
  code: string;
  name: string;
  gender_name?: string;
  country_code: string;
  alternate_code?: string;
  alternate_name?: string;
  flag_url?: string;
}

export interface Tournament {
  id: string;
  key: string;
  name: string;
  shortName: string;
  alternateName?: string;
  alternateShortName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MatchData {
  id: string;
  key: string;
  sport: string;
  format: string;
  gender: string;
  tournamentKey: string;
  name: string;
  shortName: string;
  status: string;
  metricGroup?: string;
  winner?: string | null;
  subTitle?: string;
  startedAt?: number;
  endedAt?: number;
  expectedStartedAt?: number | null;
  expectedEndedAt?: number;
  teams?: {
    a?: MatchTeam;
    b?: MatchTeam;
  };
  showOnFrontend?: boolean;
  contestGenerated?: boolean;
  createdAt?: string;
  updatedAt?: string;
  tournaments?: Tournament;
}

export interface PrizePerRank {
  rank: number;
  amount: number;
}

export interface RankRange {
  from: number;
  to: number;
  amount: number;
  totalPayout: number;
}

export interface PrizeBreakdown {
  slabs?: Record<string, unknown>;
  perRank?: PrizePerRank[];
  totalAssigned?: number;
}

export interface Contest {
  id: string;
  matchId: string;
  title: string;
  description?: string;
  type?: "pre-match" | "live" | "post-match" | string;
  difficulty?: "beginner" | "intermediate" | "expert" | string;
  startAt?: number;
  endAt?: number;
  entryFee?: number;
  prizePool?: number;
  prizeBreakdown?: PrizeBreakdown;
  rankRanges?: RankRange[];
  pointsPerQuestion?: number;
  questionsCount?: number;
  totalSpots?: number;
  filledSpots?: number;
  displayEnabled?: boolean;
  isPopular?: boolean;
  joinDeadline?: "before_match" | "fixed_time" | string;
  resultTime?: "end_of_match" | "fixed_time" | string;
  timeCommitment?: string;
  platform?: string;
  status?: ContestStatus;
  createdAt?: string;
  updatedAt?: string;
  matchData?: MatchData;
}

export type UserContest = {
  id: string;
  title?: string;
  startAt?: number | null;
  endAt?: number | null;
  status?: string | null;
  type?: string | null;
  entryFee?: number | null;
  prizePool?: number | null;
  questionsCount?: number | null;
  matchId?: string | null;
  [k: string]: Contest[keyof Contest] | null | undefined;
};

export interface ContestQuery {
  search?: string;
  matchId?: string;
  status?: string;
  // changed: use limit/offset instead of page/pageSize
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface CreateContestPayload {
  id?: string;
  matchId?: string;
  title: string;
  description?: string;
  type?: "pre-match" | "live" | "post-match" | string;
  difficulty?: "beginner" | "intermediate" | "expert" | string;
  startAt?: number;
  endAt?: number;
  entryFee?: number;
  prizePool?: number;
  pointsPerQuestion?: number;
  questionsCount?: number;
  totalSpots?: number;
  filledSpots?: number;
  displayEnabled?: boolean;
  isPopular?: boolean;
  joinDeadline?: "before_match" | "fixed_time" | string;
  resultTime?: "end_of_match" | "fixed_time" | string;
  timeCommitment?: string;
  platform?: string;
  status?: ContestStatus;
}

/** Generic API envelope used across backend */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: unknown;
  timestamp?: string;
  total?: number;
  pagination?: {
    // old pagination object (if backend uses it)
    page?: number;
    pageSize?: number;
    total?: number;
    limit?: number;
    offset?: number;
  };
}

/** Normalized list return */
export async function fetchContests(
  q: ContestQuery = {}
): Promise<{ items: Contest[]; total: number }> {
  try {
    const params: Record<string, unknown> = {};
    if (q.search) params.search = q.search;
    if (q.matchId) params.matchId = q.matchId;
    if (q.status) params.status = q.status;
    params.type = 'all'

    // use limit/offset
    if (typeof q.limit === "number") params.limit = q.limit;
    if (typeof q.offset === "number") params.offset = q.offset;

    if (q.sortBy) {
      params.sortBy = q.sortBy;
      params.sortDir = q.sortDir ?? "asc";
    }

    const res = await api.get<ApiEnvelope<Contest[]>>("/contests", { params });

    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to fetch contests");
    }

    const body = res.data;

    // case: data is array
    if (Array.isArray(body.data)) {
      const items = body.data as Contest[];
      const total = typeof body.total === "number" ? body.total : items.length;
      return { items, total };
    }

    // case: data contains items + total
    if (
      body.data &&
      typeof body.data === "object" &&
      body.data !== null &&
      "items" in body.data &&
      Array.isArray((body.data as { items?: unknown }).items)
    ) {
      const items = (body.data as { items: Contest[] }).items;
      let total: number;
      if (
        "total" in body.data &&
        typeof (body.data as { total?: unknown }).total === "number"
      ) {
        total = (body.data as { total: number }).total;
      } else if (typeof body.total === "number") {
        total = body.total;
      } else if (body.pagination && typeof body.pagination.total === "number") {
        total = body.pagination.total;
      } else {
        total = items.length;
      }
      return { items, total };
    }

    // case: body.pagination with limit/offset, and body.data is array
    if (
      body.pagination &&
      Array.isArray((body as ApiEnvelope<Contest[]>).data)
    ) {
      const items = (body as ApiEnvelope<Contest[]>).data as Contest[];
      const total =
        typeof body.pagination.total === "number"
          ? body.pagination.total
          : items.length;
      return { items, total };
    }

    // case: server returned items at top-level (unlikely but handle)
    if (Array.isArray((body as unknown as Record<string, unknown>).items)) {
      const items = (body as unknown as { items: Contest[] }).items;
      const total =
        typeof (body as unknown as { total?: number }).total === "number"
          ? (body as unknown as { total: number }).total
          : items.length;
      return { items, total };
    }

    return { items: [], total: 0 };
  } catch (err: unknown) {
    console.error("fetchContests error:", err);
    throw new Error("Failed to fetch contests");
  }
}

/** Normalized list return */
export async function fetchUserContests(
  userId: string
): Promise<{ items: UserContest[] }> {
  try {
    const res = await api.get<ApiEnvelope<UserContest[]>>(`/contests/join/${userId}`);

    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to fetch contests");
    }

    const body = res.data;

    const raw = body.data;

    if (!Array.isArray(raw)) {
      // if not an array, return empty to be safe
      return { items: [] };
    }

    // helper: get contest object from a join entry or return item itself
    const extractContest = (item: unknown): UserContest | null => {
      if (!item || typeof item !== "object" || item === null) return null;
      const obj = item as Record<string, unknown>;

      // If the join entry has nested contest object, use it
      if (
        obj.contest &&
        typeof obj.contest === "object" &&
        obj.contest !== null
      ) {
        return normalize(obj.contest as Record<string, unknown>);
      }

      // If the entry itself looks like a contest
      if (obj.title || obj.type || obj.id) {
        return normalize(obj);
      }

      // entry might be a wrapper with contest_id + other fields — try to see if contest_id exists
      if (obj.contest_id || obj.contestId) {
        // No nested contest object present — return at least id so UI can show something
        return normalize({
          id: (obj.contest_id ?? obj.contestId) as string,
          title: (obj.title as string) ?? undefined,
        } as Record<string, unknown>);
      }

      return null;
    };

    // small normalizer — extend as needed
    const normalize = (src: Record<string, unknown> | null): UserContest => {
      if (!src) return {} as UserContest;
      const parseNumber = (v: unknown) =>
        v == null || v === "" ? undefined : Number(v as number | string);
      const get = <T = unknown>(key: string) => src[key] as T | undefined;

      return {
        id: (get<string>("id") ??
          get<string>("_id") ??
          String(get<unknown>("id") ?? "")) as string,
        title: (get<string>("title") ??
          get<string>("name") ??
          get<string>("shortName")) as string | undefined,
        startAt: (get<number>("startAt") ??
          get<number>("startedAt") ??
          get<number>("expectedStartedAt") ??
          get<number>("start_at") ??
          null) as number | null | undefined,
        endAt: (get<number>("endAt") ??
          get<number>("endedAt") ??
          get<number>("expectedEndedAt") ??
          get<number>("end_at") ??
          null) as number | null | undefined,
        status: (get<string>("status") ?? null) as string | null,
        type: (get<string>("type") ?? null) as string | null,
        entryFee: parseNumber(
          get<unknown>("entryFee") ?? get<unknown>("entry_fee")
        ),
        prizePool: parseNumber(
          get<unknown>("prizePool") ?? get<unknown>("prize_pool")
        ),
        questionsCount: parseNumber(
          get<unknown>("questionsCount") ?? get<unknown>("questions_count")
        ),
        matchId: (get<string>("matchId") ?? get<string>("match_id") ?? null) as
          | string
          | null,
        ...(src as Record<string, unknown>), // keep other fields if UI needs them
      } as UserContest;
    };

    const items: UserContest[] = raw
      .map(extractContest)
      .filter((c): c is UserContest => !!c);

    return { items };
  } catch (err: unknown) {
    console.error("fetchUserContests error:", err);
    throw new Error("Failed to fetch contests");
  }
}

/** Fetch single contest */
export async function fetchContest(id: string): Promise<Contest> {
  try {
    const res = await api.get<ApiEnvelope<Contest>>(`/contests/${id}`);
    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to fetch contest");
    }

    const body = res.data.data ?? res.data;
    if (body && body.id) {
      return body as Contest;
    }

    throw new Error("Invalid response from server");
  } catch (err: unknown) {
    console.error("fetchContest error:", err);
    throw new Error("Failed to fetch contest");
  }
}

/** Create contest */
export async function createContest(
  payload: CreateContestPayload
): Promise<Contest> {
  try {
    const res = await api.post<ApiEnvelope<Contest>>("/contests", payload);
    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to create contest");
    }
    return res.data.data as Contest;
  } catch (err: unknown) {
    console.error("createContest error:", err);
    throw new Error("Failed to create contest");
  }
}

/** Update contest */
export async function updateContest(
  id: string,
  payload: Partial<CreateContestPayload>
): Promise<Contest> {
  try {
    const res = await api.put<ApiEnvelope<Contest>>(`/contests/${id}`, payload);
    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to update contest");
    }
    return res.data.data as Contest;
  } catch (err: unknown) {
    console.error("updateContest error:", err);
    throw new Error("Failed to update contest");
  }
}

/** Delete contest */
export async function deleteContest(id: string): Promise<void> {
  try {
    const res = await api.delete<ApiEnvelope<null>>(`/contests/${id}`);
    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to delete contest");
    }
  } catch (err: unknown) {
    console.error("deleteContest error:", err);
    throw new Error("Failed to delete contest");
  }
}

/** Patch contest (partial update for visibility, status, etc.) */
export async function patchContest(
  id: string,
  payload: Partial<CreateContestPayload>
): Promise<Contest> {
  try {
    const res = await api.patch<ApiEnvelope<Contest>>(`/contests/${id}`, payload);
    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to update contest");
    }
    return res.data.data as Contest;
  } catch (err: unknown) {
    console.error("patchContest error:", err);
    throw new Error("Failed to update contest");
  }
}

/** Fetch contest participants */
export interface ContestParticipant {
  id: string;
  userId: string;
  contestId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  joinedAt?: string | number;
  score?: number;
  rank?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  contestId: string;
  totalScore: number;
  maxScore?: number;
  percentage?: number;
  submittedAt?: string;
  correctAnswers?: number;
  totalAnswers?: number;
  answers?: Array<{
    ansKey: string;
    earnedPoints: number;
    isCorrect: boolean;
    note: string;
    options: Array<string>;
    question: string;
    questionId: string;
    selectedKey: string;
  }>;
}

export interface LeaderboardResponse {
  contestId: string;
  contestTitle: string;
  totalParticipants: number;
  leaderboard: LeaderboardEntry[];
  userRank: number | null;
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export async function fetchContestParticipants(
  contestId: string
): Promise<{ items: ContestParticipant[]; total: number }> {
  try {
    const res = await api.get<ApiEnvelope<ContestParticipant[]>>(
      `/contests/${contestId}/participants`
    );
    
    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to fetch participants");
    }

    const body = res.data;
    
    // Handle array response
    if (Array.isArray(body.data)) {
      const items = body.data as ContestParticipant[];
      const total = typeof body.total === "number" ? body.total : items.length;
      return { items, total };
    }

    // Handle nested items response
    if (body.data && typeof body.data === "object" && "items" in body.data) {
      const items = (body.data as { items: ContestParticipant[] }).items;
      const total = 
        (body.data as { total?: number }).total ?? 
        body.total ?? 
        items.length;
      return { items, total };
    }

    return { items: [], total: 0 };
  } catch (err: unknown) {
    console.error("fetchContestParticipants error:", err);
    throw new Error("Failed to fetch participants");
  }
}

/** Fetch contest leaderboard with detailed rankings */
export async function fetchContestLeaderboard(
  contestId: string
): Promise<LeaderboardResponse> {
  try {
    const res = await api.get<ApiEnvelope<LeaderboardResponse>>(
      `/contests/${contestId}/leaderboard`
    );
    
    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to fetch leaderboard");
    }

    return res.data.data as LeaderboardResponse;
  } catch (err: unknown) {
    console.error("fetchContestLeaderboard error:", err);
    throw new Error("Failed to fetch leaderboard");
  }
}

/** Fetch user's answers in a contest */
export async function fetchUserContestAnswers(
  contestId: string,
  userId: string
): Promise<LeaderboardEntry> {
  try {
    const res = await api.get<ApiEnvelope<LeaderboardEntry>>(
      `/questions/submissions/contest/${contestId}/user/${userId}`
    );
    
    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to fetch user answers");
    }

    return res.data.data as LeaderboardEntry;
  } catch (err: unknown) {
    console.error("fetchUserContestAnswers error:", err);
    throw new Error("Failed to fetch user answers");
  }
}

/** Leaderboard history types */
export interface LeaderboardHistoryEntry {
  contestId: string;
  contestName: string;
  matchInfo: string;
  rank: number;
  totalParticipants: number;
  score: number;
  date: string;
  contest?: Contest;
  matchData?: MatchData;
}

export interface PerformanceStats {
  totalContests: number;
  averageRank: number;
  bestRank: number;
  top10Finishes: number;
  top3Finishes: number;
  totalScore: number;
  winRate: number;
  percentile: number;
}

export interface UserLeaderboardHistory {
  recentEntries: LeaderboardHistoryEntry[];
  stats: PerformanceStats;
}

/** Fetch user's leaderboard history with performance stats */
export async function fetchUserLeaderboardHistory(
  userId: string,
  limit: number = 10
): Promise<UserLeaderboardHistory> {
  try {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));

    const url = `leaderboard/user/${encodeURIComponent(userId)}/history${params.toString() ? `?${params.toString()}` : ""}`;

    const res = await api.get<ApiEnvelope<UserLeaderboardHistory>>(url);
    
    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to fetch user leaderboard history");
    }

    return res.data.data;
  } catch (err: unknown) {
    console.error("fetchUserLeaderboardHistory error:", err);
    throw new Error("Failed to fetch user leaderboard history");
  }
}

/** User joined contest detail type */
export interface UserContestDetail {
  id: string;
  contestId: string;
  contestTitle: string;
  matchInfo: string;
  entryFee: number;
  rank: number | null;
  score: number;
  totalParticipants: number;
  prize: number;
  status: "ongoing" | "completed" | "upcoming";
  joinedAt: string;
  // Full contest and match data
  contest?: Contest;
  matchData?: MatchData;
}

/** Fetch user's joined contests with detailed information */
export async function fetchUserContestHistory(userId: string): Promise<UserContestDetail[]> {
  try {
    const url = `contests/user/${encodeURIComponent(userId)}/history`;

    const res = await api.get<ApiEnvelope<UserContestDetail[]>>(url);
    
    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message ?? "Failed to fetch user contests");
    }

    return res.data.data;
  } catch (err: unknown) {
    console.error("fetchUserContestHistory error:", err);
    throw new Error("Failed to fetch user contests");
  }
}

export default {
  fetchContests,
  fetchContest,
  createContest,
  updateContest,
  deleteContest,
  patchContest,
  fetchContestParticipants,
  fetchContestLeaderboard,
  fetchUserContestAnswers,
  fetchUserLeaderboardHistory,
  fetchUserContests,
  fetchUserContestHistory,
};
