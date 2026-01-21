// src/components/contests/CreateQuestionModal.tsx
import React, { useCallback, useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import {
  Question,
  CreateQuestionPayload,
  createQuestion,
} from "../../api/questions";

/**
 * NOTE: adjust these import paths if your API helpers live elsewhere.
 * I assume:
 *  - fetchContests({ limit, offset }) -> { items: Contest[] }
 *  - fetchMatches({ limit, offset }) -> { items: Match[] }
 */
import { fetchContests } from "../../api/contests";
import { fetchMatches } from "../../api/matches";
import { useParams } from "react-router";

type Props = {
  isOpen: boolean;
  openModal?: () => void;
  closeModal: () => void;
  onCreated?: (question: Question) => void;
};

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
  startAt?: number | null; // stored as UNIX seconds or null
  endAt?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SimpleMatch = {
  id: string;
  key?: string;
  name?: string; // "New Zealand vs England"
  shortName?: string; // "NZ vs ENG"
  subTitle?: string; // "2nd Match"
  sport?: string; // "cricket"
  format?: string; // "oneday"
  gender?: string; // "male"
  status?: string; // "not_started" | "running" | "completed" | ...
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
  title?: string; // alias for name (optional convenience)
};
export default function CreateQuestionModal({
  isOpen,
  closeModal,
  onCreated,
}: Props) {
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
    if (isOpen) {
      setMessage(null);
      setErrorMessage(null);
      setErrors({});
      // load lists when modal opens
      loadContests();
      loadMatches();
    }
  }, [isOpen]);

  const resetForm = () => {
    setContestId("");
    setMatchId("");
    setQuestion("");
    setOptions(["Option 1", "Option 2", "Option 3", "Option 4"]);
    setAnsKey(null);
    setPoints(20);
    setErrors({});
    setMessage(null);
    setErrorMessage(null);
  };

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
      // tune limit/offset as required
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
      const created = await createQuestion(payload);
      setMessage("Question created successfully");
      if (onCreated) onCreated(created);

      setTimeout(() => {
        closeModal();
        resetForm();
      }, 700);
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
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        resetForm();
      }}
      className="max-w-[700px] p-6 lg:p-8"
    >
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            Create Question
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create a question for a contest. Provide question text, options and
            points.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Match
              </label>
              <div className="mt-1">
                <select
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">— None —</option>
                  {matchesLoading && (
                    <option value="">Loading matches...</option>
                  )}
                  {!matchesLoading &&
                    matches.map((m) => {
                      return (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      );
                    })}
                </select>

                {matchesError && (
                  <div className="text-xs text-red-600 mt-1">
                    {matchesError}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <div>{matches.length} matches loaded</div>
                  <div>
                    <button
                      type="button"
                      onClick={loadMatches}
                      className="text-xs underline"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contest
              </label>
              <div className="mt-1">
                <select
                  value={contestId}
                  onChange={(e) => handleContestChange(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">— None —</option>
                  {contestsLoading && (
                    <option value="">Loading contests...</option>
                  )}
                  {!contestsLoading &&
                    contests.map((c) => {
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
                  <div className="text-xs text-red-600 mt-1">
                    {contestsError}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <div>{contests.length} contests loaded</div>
                  <div>
                    <button
                      type="button"
                      onClick={loadContests}
                      className="text-xs underline"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Question
            </label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Who will win the match?"
              className="w-full mt-1 border rounded px-3 py-2 text-sm"
            />
            {errors.question && (
              <div className="text-xs text-red-600 mt-1">{errors.question}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Options
            </label>

            <div className="space-y-2 mt-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                  <select
                    value={ansKey === opt ? String(idx) : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") {
                        setAnsKey(null);
                      } else {
                        const selectedIndex = Number(v);
                        // set ansKey to the option text (trimmed)
                        setAnsKey(
                          (options[selectedIndex] || "").trim() || null
                        );
                      }
                    }}
                    className="border rounded px-2 py-1 text-sm"
                    aria-label="Select correct option"
                  >
                    <option value="">— correct —</option>
                    {options.map((o, i) => (
                      <option key={`option-${i}-${o}`} value={i}>
                        {`#${i + 1}`}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="px-2 py-1 rounded-md text-sm bg-red-50 text-red-700 hover:bg-red-100"
                    aria-label={`Remove option ${idx + 1}`}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {errors.options && (
                <div className="text-xs text-red-600 mt-1">
                  {errors.options}
                </div>
              )}

              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-3 py-1 rounded-md bg-gray-100 text-sm"
                >
                  + Add option
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Points
              </label>
              <input
                type="number"
                min={1}
                value={points}
                onChange={(e) =>
                  setPoints(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full mt-1 border rounded px-3 py-2 text-sm"
              />
              {errors.points && (
                <div className="text-xs text-red-600 mt-1">{errors.points}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Answer Key (optional)
              </label>
              <input
                value={ansKey ?? ""}
                onChange={(e) =>
                  setAnsKey(e.target.value === "" ? null : e.target.value)
                }
                placeholder="Exact option text (optional)"
                className="w-full mt-1 border rounded px-3 py-2 text-sm"
              />
              {errors.ansKey && (
                <div className="text-xs text-red-600 mt-1">{errors.ansKey}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Preview
              </label>
              <div className="mt-1 text-xs text-gray-500">
                {question ? question : "Question preview"}
                <div className="mt-1">
                  {options.map((o, i) => (
                    <div key={i} className="text-xs text-gray-600">
                      {i + 1}. {o || "—"}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 justify-end">
            <button
              type="button"
              onClick={() => {
                closeModal();
                resetForm();
              }}
              className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={busy}
              onClick={handleSubmit}
              className="flex justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {busy ? "Creating..." : "Create Question"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
