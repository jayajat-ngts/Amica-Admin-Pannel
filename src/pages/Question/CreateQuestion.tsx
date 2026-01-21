import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CreateQuestionPayload,
  createQuestion,
} from "../../api/questions";
import { fetchContests } from "../../api/contests";
import { fetchMatches } from "../../api/matches";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";

type FieldErrors = Partial<
  Record<keyof CreateQuestionPayload | "options" | "ansKey", string>
>;

type SimpleContest = {
  id: string;
  title: string;
  description?: string;
  type?: string;
  difficulty?: "beginner" | "intermediate" | "expert";
  entryFee?: number;
  prizePool?: number;
  totalSpots?: number;
  filledSpots?: number;
  pointsPerQuestion?: number;
  questionsCount?: number;
  timeCommitment?: string;
  matchId?: string;
  platform?: string;
  displayEnabled?: boolean;
  isPopular?: boolean;
  joinDeadline?: string;
  resultTime?: string;
  status?: "scheduled" | "running" | "completed" | "cancelled";
  startAt?: number | null;
  endAt?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SimpleMatch = {
  id: string;
  key?: string;
  name?: string;
  shortName?: string;
  subTitle?: string;
  sport?: string;
  format?: string;
  gender?: string;
  status?: string;
  showOnFrontend?: boolean;
  wishlisted?: boolean;
  winner?: string | null;
  startedAt?: number | null;
  expectedStartedAt?: number | null;
  expectedEndedAt?: number | null;
  endedAt?: number | null;
  metricGroup?: string;
  tournamentKey?: string;
  tournaments?: unknown;
  teams?: unknown;
  createdAt?: string;
  updatedAt?: string;
  title?: string;
};

export default function CreateQuestion() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  // form fields for question
  const [contestId, setContestId] = useState<string>(id || "");
  const [matchId, setMatchId] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [options, setOptions] = useState<string[]>([
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4",
  ]);
  const [ansKey, setAnsKey] = useState<string | null>(null);
  const [points, setPoints] = useState<number | "">(20);

  // contests / matches dropdown state
  const [contests, setContests] = useState<SimpleContest[]>([]);
  const [contestsLoading, setContestsLoading] = useState(false);
  const [contestsError, setContestsError] = useState<string | null>(null);

  const [matches, setMatches] = useState<SimpleMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  useEffect(() => {
    loadContests();
    loadMatches();
  }, []);

  const validate = (): boolean => {
    const e: FieldErrors = {};
    if (!question || !question.trim()) e.question = "Question text is required";
    const cleanedOptions = options.map((o) => (o ? o.trim() : ""));
    const nonEmpty = cleanedOptions.filter((o) => o.length > 0);
    if (nonEmpty.length < 2) e.options = "At least 2 options are required";
    if (points !== "" && typeof points === "number" && points <= 0)
      e.points = "Points must be > 0";

    // if ansKey provided, ensure it exists in options
    if (ansKey && !nonEmpty.includes(ansKey)) {
      e.ansKey = "Answer key must match one of the options";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddOption = () => {
    setOptions((s) => [...s, ""]);
  };

  const handleRemoveOption = (idx: number) => {
    setOptions((s) => s.filter((_, i) => i !== idx));
    // if removed option was ansKey, clear ansKey
    if (options[idx] === ansKey) setAnsKey(null);
  };

  const handleOptionChange = (idx: number, value: string) => {
    setOptions((s) => s.map((o, i) => (i === idx ? value : o)));
    // If ansKey was the same text and user edits it, clear ansKey to avoid mismatch
    if (options[idx] === ansKey && value.trim() !== ansKey) {
      setAnsKey(null);
    }
  };

  // load contests
  const loadContests = useCallback(async () => {
    setContestsLoading(true);
    setContestsError(null);
    try {
      const res = await fetchContests({ limit: 100, offset: 0 });
      const items = res?.items ?? [];
      setContests(items as SimpleContest[]);
    } catch (err) {
      console.error("loadContests error", err);
      setContestsError("Failed to load contests");
    } finally {
      setContestsLoading(false);
    }
  }, []);

  // load matches
  const loadMatches = useCallback(async () => {
    setMatchesLoading(true);
    setMatchesError(null);
    try {
      const res = await fetchMatches({ limit: 100, offset: 0 });
      const items = res?.items ?? [];
      setMatches(items as SimpleMatch[]);
    } catch (err) {
      console.error("loadMatches error", err);
      setMatchesError("Failed to load matches");
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  const handleSubmit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    if (!validate()) return;

    const payload: CreateQuestionPayload = {
      contestId: contestId || undefined,
      matchId: matchId || undefined,
      question: question.trim(),
      options: options.map((o) => o.trim()).filter((o) => o.length > 0),
      ansKey: ansKey ?? null,
      points: points === "" ? undefined : Number(points),
    };

    try {
      setBusy(true);
      await createQuestion(payload);
      setMessage("Question created successfully");

      setTimeout(() => {
        if (id) {
          navigate(`/questions/${id}`);
        } else {
          navigate("/questions");
        }
      }, 1000);
    } catch (err: unknown) {
      console.error("createQuestion error", err);
      setErrorMessage("Failed to create question");
    } finally {
      setBusy(false);
      setTimeout(() => {
        setMessage(null);
        setErrorMessage(null);
      }, 4000);
    }
  };

  const handleContestChange = (contestId: string) => {
    setContestId(contestId);

    // find contest and auto set matchId
    const contest = contests.find((c) => c.id === contestId);
    if (contest?.matchId) {
      setMatchId(contest.matchId);
    } else {
      // clear if contest doesn't have a match
      setMatchId("");
    }
  };

  const handleMatchChange = (newMatchId: string) => {
    setMatchId(newMatchId);
    // Clear contest selection when match changes
    setContestId("");
  };

  // Filter contests based on selected match
  const filteredContests = matchId
    ? contests.filter((c) => c.matchId === matchId)
    : contests;

  useEffect(() => {
    if (id) {
      setContestId(id);
      // find contest and set matchId
      const contest = contests.find((c) => c.id === id);
      if (contest?.matchId) {
        setMatchId(contest.matchId);
      }
    }
  }, [id, contests]);

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Create Question" />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Question
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create a question for a contest. Provide question text, options, and
            points.
          </p>
        </div>

        {/* Messages */}
        <div className="p-6">
          {message && (
            <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-green-800 dark:text-green-300">
              {message}
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-red-800 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contest and Match Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Match
                </label>
                <select
                  value={matchId}
                  onChange={(e) => handleMatchChange(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  <option value="">— Select Match —</option>
                  {matchesLoading && (
                    <option value="">Loading matches...</option>
                  )}
                  {!matchesLoading &&
                    matches.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>

                {matchesError && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {matchesError}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <div>{matches.length} matches loaded</div>
                  <button
                    type="button"
                    onClick={loadMatches}
                    className="text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Contest
                  
                </label>
                <select
                  value={contestId}
                  onChange={(e) => handleContestChange(e.target.value)}
                  disabled={!matchId}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!matchId ? "— Select a match first —" : "— Select Contest —"}
                  </option>
                  {contestsLoading && (
                    <option value="">Loading contests...</option>
                  )}
                  {!contestsLoading &&
                    matchId &&
                    filteredContests.map((c) => {
                      const dateLabel = c.startAt
                        ? ` (${new Date(
                            c.startAt * 1000
                          ).toLocaleDateString()})`
                        : "";
                      return (
                        <option key={c.id} value={c.id}>
                          {c.title}
                          {dateLabel}
                        </option>
                      );
                    })}
                </select>

                {contestsError && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {contestsError}
                  </div>
                )}

                {!matchId && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Please select a match to view contests
                  </div>
                )}

                {matchId && filteredContests.length === 0 && !contestsLoading && (
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    No contests found for this match
                  </div>
                )}

                {matchId && filteredContests.length > 0 && (
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <div>
                      Showing {filteredContests.length} contest{filteredContests.length !== 1 ? 's' : ''}
                    </div>
                    <button
                      type="button"
                      onClick={loadContests}
                      className="text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Question Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Question <span className="text-red-500">*</span>
              </label>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Who will win the match?"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              {errors.question && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {errors.question}
                </div>
              )}
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Options <span className="text-red-500">*</span>
              </label>

              <div className="space-y-3">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={ansKey === opt ? String(idx) : ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          setAnsKey(null);
                        } else {
                          const selectedIndex = Number(v);
                          setAnsKey(
                            (options[selectedIndex] || "").trim() || null
                          );
                        }
                      }}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      aria-label="Mark as correct answer"
                    >
                      <option value="">Correct?</option>
                      {options.map((o, i) => (
                        <option key={`option-${i}-${o}`} value={i}>
                          {`#${i + 1}`}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="px-3 py-2.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition"
                      aria-label={`Remove option ${idx + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {errors.options && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.options}
                  </div>
                )}

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    + Add Option
                  </button>
                </div>
              </div>
            </div>

            {/* Points and Answer Key */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Points <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={points}
                  onChange={(e) =>
                    setPoints(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                {errors.points && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.points}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Answer Key (optional)
                </label>
                <input
                  value={ansKey ?? ""}
                  onChange={(e) =>
                    setAnsKey(e.target.value === "" ? null : e.target.value)
                  }
                  placeholder="Exact option text"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                {errors.ansKey && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.ansKey}
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Preview
              </h3>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {question || "Question preview"}
                </div>
                <div className="space-y-1.5">
                  {options.map((o, i) => (
                    <div
                      key={i}
                      className={`text-xs px-3 py-2 rounded-md ${
                        ansKey === o
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {i + 1}. {o || "—"}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Points: {points || 0}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 md:flex-none justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 md:flex-none justify-center rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm hover:shadow-md"
              >
                {busy ? "Creating..." : "Create Question"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
