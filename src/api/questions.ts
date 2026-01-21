import { api } from "../utils/axios";
import type { Contest, MatchData } from "./contests";

export interface Question {
  id: string;
  contestId?: string;
  matchId?: string;
  question: string;
  options?: string[];
  ansKey?: string | null; // ✅ single correct answer field
  points?: number;
  displayOnFrontend?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionQuery {
  search?: string;
  contestId?: string;
  matchId?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface CreateQuestionPayload {
  id?: string;
  contestId?: string;
  matchId?: string;
  question: string;
  options?: string[];
  ansKey?: string | null;
  points?: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: unknown;
  total?: number;
  pagination?: { page: number; pageSize: number; total: number };
}

export type ExtendedOption =
  | string
  | { id?: string; value?: string; text?: string; label?: string };

export interface ExtendedQuestion extends Omit<Question, "options"> {
  options?: ExtendedOption[];
  contestData?: Contest;
  matchData?: MatchData;
}

/** Fetch list */
export async function fetchQuestions(
  q: QuestionQuery = {}
): Promise<{ items: Question[]; total: number }> {
  const params: Record<string, unknown> = {};
  if (q.search) params.search = q.search;
  if (q.contestId) params.contestId = q.contestId;
  if (q.matchId) params.matchId = q.matchId;
  if (typeof q.limit === "number") params.limit = q.limit;
  if (typeof q.offset === "number") params.offset = q.offset;
  if (q.sortBy) {
    params.sortBy = q.sortBy;
    params.sortDir = q.sortDir ?? "asc";
  }

  const res = await api.get<ApiEnvelope<Question[]>>("/questions", { params });
  if (!res.data || !res.data.success) {
    throw new Error(res.data?.message ?? "Failed to fetch questions");
  }

  const body = res.data;
  if (Array.isArray(body.data)) {
    return {
      items: body.data as Question[],
      total: typeof body.total === "number" ? body.total : body.data.length,
    };
  }
  if (
    body.data &&
    typeof body.data === "object" &&
    "items" in body.data &&
    Array.isArray((body.data as { items?: unknown }).items)
  ) {
    const items = (body.data as { items: Question[] }).items;
    return {
      items,
      total:
        typeof (body.data as { total?: number }).total === "number"
          ? (body.data as { total: number }).total
          : items.length,
    };
  }
  return { items: [], total: 0 };
}

/** Fetch single */
export async function fetchQuestion(id: string): Promise<Question> {
  const res = await api.get<ApiEnvelope<Question>>(`/questions/${id}`);
  if (!res.data || !res.data.success) {
    throw new Error(res.data?.message ?? "Failed to fetch question");
  }
  return res.data.data as Question;
}

/** Create */
export async function createQuestion(
  payload: CreateQuestionPayload
): Promise<Question> {
  const res = await api.post<ApiEnvelope<Question>>("/questions", payload);
  if (!res.data || !res.data.success) {
    throw new Error(res.data?.message ?? "Failed to create question");
  }
  return res.data.data as Question;
}

/** Full replace update */
export async function updateQuestion(
  id: string,
  payload: Partial<CreateQuestionPayload>
): Promise<Question> {
  const res = await api.put<ApiEnvelope<Question>>(`/questions/${id}`, payload);
  if (!res.data || !res.data.success) {
    throw new Error(res.data?.message ?? "Failed to update question");
  }
  return res.data.data as Question;
}

/** Partial update (PATCH) */
export async function patchQuestion(
  id: string,
  payload: Record<string, unknown>
): Promise<Question> {
  const res = await api.patch<ApiEnvelope<Question>>(`/questions/${id}`, payload);
  if (!res.data || !res.data.success) {
    throw new Error(res.data?.message ?? "Failed to patch question");
  }
  return res.data.data as Question;
}

/** Delete */
export async function deleteQuestion(id: string): Promise<void> {
  const res = await api.delete<ApiEnvelope<null>>(`/questions/${id}`);
  if (!res.data || !res.data.success) {
    throw new Error(res.data?.message ?? "Failed to delete question");
  }
}

export default {
  fetchQuestions,
  fetchQuestion,
  createQuestion,
  updateQuestion,
  patchQuestion,
  deleteQuestion,
};
