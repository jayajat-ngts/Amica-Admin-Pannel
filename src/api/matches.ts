// src/api/matches.ts
import { api } from "../utils/axios";
import type { AxiosRequestConfig } from "axios";
import { ApiEnvelope } from "./contests";

export type MatchStatus = "not_started" | "started" | "completed" | "abandoned" | "cancelled";
export type MatchFormat = "t20" | "oneday" | "test";

export interface ApiTeam {
  key: string;
  code?: string | null;
  name?: string | null;
  gender_name?: string | null;
  country_code?: string | null;
  alternate_code?: string | null;
  alternate_name?: string | null;
}

export interface TournamentRef {
  id: string;
  key?: string;
  name?: string;
  shortName?: string;
  alternateName?: string;
  alternateShortName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiMatch {
  id: string;
  key: string;
  sport: string;
  format: MatchFormat;
  gender?: string;
  tournamentKey?: string;
  name: string;
  shortName?: string;
  status?: MatchStatus;
  metricGroup?: string;
  winner?: string | null;
  subTitle?: string | null;
  startedAt?: number | null; // unix seconds
  endedAt?: number | null;
  expectedStartedAt?: number | null;
  expectedEndedAt?: number | null;
  teams?: { a?: ApiTeam; b?: ApiTeam };
  createdAt?: string;
  updatedAt?: string;
  tournaments?: TournamentRef;
  // UI-only flags (local): not present on server by default but kept for client usage
  showOnFrontend?: boolean;
  contestGenerated?: boolean;
  subscribed?: boolean;
}

export interface MatchesPagination {
  total: number;
  page: number;
  limit: number | string;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MatchesResponse {
  success: boolean;
  message?: string;
  data?: {
    matches: ApiMatch[];
    pagination?: MatchesPagination;
  };
  errors?: unknown;
  timestamp?: string;
}

export interface MatchesQuery {
  sport?: string;
  search?: string;
  status?: MatchStatus | "all";
  format?: MatchFormat | "all";
  limit?: number;
  offset?: number;
  page?: number; // optional alias
  pageSize?: number;
  date?: string; // Date filter in YYYY-MM-DD format
  tournamentKey?: string; // Tournament filter
}

/* -------------------------
   Axios-backed implementations
--------------------------*/

/** Small helper to normalise axios errors into a thrown Error with server message when possible */
function makeError(err: unknown) {
  return err instanceof Error ? err : new Error(String(err));
}

/**
 * Fetch matches with filtering + pagination.
 * Calls: GET /api/v1/matches?sport=...&limit=...&offset=...
 */
export async function fetchMatches(
  query: MatchesQuery = {},
  config?: AxiosRequestConfig
): Promise<{
  items: ApiMatch[];
  total: number;
  pagination: MatchesPagination;
}> {
  try {
    const params: Record<string, unknown> = {};
    if (query.sport) params.sport = query.sport;
    if (query.search) params.search = query.search;
    if (query.format && query.format !== "all") params.format = query.format;
    if (typeof query.limit !== "undefined") params.limit = query.limit;
    if (typeof query.offset !== "undefined") params.offset = query.offset;
    if (typeof query.page !== "undefined") params.page = query.page;
    if (typeof query.pageSize !== "undefined") params.pageSize = query.pageSize;
    if (query.date) params.date = query.date; // Add date filter support
    if (query.tournamentKey) params.tournamentKey = query.tournamentKey; // Add tournament filter support

    params.status = query.status && query.status !== "all" ? query.status : "all";
    const res = await api.get<MatchesResponse>("/matches", {
      params,
      ...config,
    });

    const body = res.data;

    // If API respects the envelope
    if (body && body.success && body.data) {
      return {
        items: body.data.matches ?? [],
        total: body.data.pagination?.total ?? body.data.matches?.length ?? 0,
        pagination:
          body.data.pagination ??
          ({
            total: body.data.matches?.length ?? 0,
            page: 1,
            limit: String(query.limit ?? query.pageSize ?? 10),
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          } as MatchesPagination),
      };
    }

    // fallback: try to read shape like { matches, pagination } directly from res.data
    const raw: MatchesResponse = res.data;
    const items: ApiMatch[] = raw?.data?.matches ?? raw?.data?.matches ?? [];
    const pagination: MatchesPagination = raw?.data?.pagination ?? {
      total: items.length,
      page: 1,
      limit: String(query.limit ?? query.pageSize ?? 10),
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    };

    return { items, total: pagination.total, pagination };
  } catch (err) {
    throw makeError(err);
  }
}

/**
 * Fetch all tournaments
 * Calls: GET /api/v1/tournaments
 */
export async function fetchTournaments(
  config?: AxiosRequestConfig
): Promise<TournamentRef[]> {
  try {
    const res = await api.get<ApiEnvelope<TournamentRef[]>>("/matches/tournaments", config);

    if (res.data && res.data.success && res.data.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("fetchTournaments error:", err);
    return [];
  }
}

/**
 * Generate contest for a match:
 * POST /api/v1/matches/:id/generate
 */
export async function generateContest(
  matchData: unknown,
  config?: AxiosRequestConfig
): Promise<unknown> {
  try {
    const res = await api.post(
      "/contests/generate",
      { matchData },
      config
    );
    return res.data;
  } catch (err) {
    throw makeError(err);
  }
}

/**
 * Patch match metadata (partial update)
 * PATCH /api/v1/matches/:id
 * Returns the updated match if server returns it.
 */
export async function patchMatch(
  matchId: string,
  patch: Partial<ApiMatch>,
  config?: AxiosRequestConfig
): Promise<ApiMatch> {
  try {
    const res = await api.patch(
      `/matches/${encodeURIComponent(matchId)}`,
      patch,
      config
    );
    const body = res.data;
    // Many servers return updated object in data.match or data
    if (body && typeof body === "object") {
      if (body.data?.match) return body.data.match as ApiMatch;
      if (body.match) return body.match as ApiMatch;
      if (body.data && Array.isArray(body.data))
        return body.data as unknown as ApiMatch;
    }
    return body as ApiMatch;
  } catch (err) {
    throw makeError(err);
  }
}

/**
 * Subscribe / Unsubscribe
 * POST /api/v1/matches/:id/subscribe
 * POST /api/v1/matches/:id/unsubscribe
 */
export async function subscribeToMatch(
  matchId: string,
  config?: AxiosRequestConfig
) {
  try {
    const res = await api.post(
      `/api/v1/matches/${encodeURIComponent(matchId)}/subscribe`,
      {},
      config
    );
    return res.data;
  } catch (err) {
    throw makeError(err);
  }
}

export async function unsubscribeFromMatch(
  matchId: string,
  config?: AxiosRequestConfig
) {
  try {
    const res = await api.post(
      `/api/v1/matches/${encodeURIComponent(matchId)}/unsubscribe`,
      {},
      config
    );
    return res.data;
  } catch (err) {
    throw makeError(err);
  }
}

/**
 * Delete a match
 * DELETE /api/v1/matches/:id
 */
export async function deleteMatch(
  matchId: string,
  config?: AxiosRequestConfig
): Promise<unknown> {
  try {
    const res = await api.delete(
      `/api/v1/matches/${encodeURIComponent(matchId)}`,
      config
    );
    return res.data;
  } catch (err) {
    throw makeError(err);
  }
}

/**
 * Regenerate match API token
 * GET /api/v1/matches/regenerate-token
 */
export async function regenerateMatchToken(
  config?: AxiosRequestConfig
): Promise<{ success: boolean; message?: string; data?: { token: string } }> {
  try {
    const res = await api.get("/matches/regenerate-token", config);
    return res.data;
  } catch (err) {
    throw makeError(err);
  }
}
