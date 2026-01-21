import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import {
  CreateContestPayload,
  createContest,
} from "../../api/contests";
import { fetchMatches } from "../../api/matches";

type FieldErrors = Partial<Record<keyof CreateContestPayload, string>>;

type MatchOption = {
  id: string;
  title?: string;
  startAt?: number;
  homeTeam?: string;
  awayTeam?: string;
  status?: string;
};

export default function CreateContest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  // form fields
  const [matchId, setMatchId] = useState<string>(id || "");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [type, setType] = useState<"pre-match" | "live" | "post-match">(
    "pre-match"
  );
  const [difficulty, setDifficulty] = useState<
    "beginner" | "intermediate" | "expert"
  >("beginner");

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  const [entryFee, setEntryFee] = useState<number | "">("");
  const [prizePool, setPrizePool] = useState<number | "">("");
  const [pointsPerQuestion, setPointsPerQuestion] = useState<number | "">(4);
  const [questionsCount, setQuestionsCount] = useState<number | "">(10);
  const [totalSpots, setTotalSpots] = useState<number | "">(1000);

  const [platform, setPlatform] = useState<string>("web");
  const [displayEnabled, setDisplayEnabled] = useState<boolean>(true);
  const [isPopular, setIsPopular] = useState<boolean>(false);

  const [joinDeadline, setJoinDeadline] = useState<
    "before_match" | "fixed_time"
  >("before_match");
  const [resultTime, setResultTime] = useState<"end_of_match" | "fixed_time">(
    "end_of_match"
  );

  const [timeCommitment, setTimeCommitment] = useState<string>("10 minutes");

  const [status, setStatus] = useState<
    "upcoming" | "joining_closed" | "live" | "calculating" | "completed" | "cancelled"
  >("upcoming");

  // matches dropdown
  const [matches, setMatches] = useState<MatchOption[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = useCallback(async () => {
    setMatchesLoading(true);
    setMatchesError(null);
    try {
      const q = { limit: 100, offset: 0 };
      const res = await fetchMatches(q);
      const items = res?.items ?? [];

      const mapped = items.map((m) => {
        const matchData = m as unknown as Record<string, unknown>;
        const id = (matchData.id ?? matchData._id ?? matchData.uuid ?? String(matchData.id)) as string;
        const title =
          (matchData.title as string) ||
          (matchData.homeTeam && matchData.awayTeam
            ? `${matchData.homeTeam} vs ${matchData.awayTeam}`
            : (matchData.name as string)) ||
          id;
        const startAt = (matchData.startAt ?? matchData.start_time ?? matchData.startAtUnix) as number | undefined;
        return {
          id,
          title,
          startAt,
          homeTeam: matchData.homeTeam as string | undefined,
          awayTeam: matchData.awayTeam as string | undefined,
          status: matchData.status as string | undefined,
        } as MatchOption;
      });

      setMatches(mapped);
    } catch (err) {
      console.error("loadMatches error", err);
      setMatchesError("Failed to load matches");
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  const validate = (): boolean => {
    const e: FieldErrors = {};
    if (!title || !title.trim()) e.title = "Title is required";
    if (entryFee !== "" && typeof entryFee === "number" && entryFee < 0)
      e.entryFee = "Entry fee must be >= 0";
    if (prizePool !== "" && typeof prizePool === "number" && prizePool < 0)
      e.prizePool = "Prize pool must be >= 0";
    if (
      pointsPerQuestion !== "" &&
      typeof pointsPerQuestion === "number" &&
      pointsPerQuestion <= 0
    )
      e.pointsPerQuestion = "Points per question must be > 0";
    if (
      questionsCount !== "" &&
      typeof questionsCount === "number" &&
      questionsCount <= 0
    )
      e.questionsCount = "Questions count must be > 0";
    if (totalSpots !== "" && typeof totalSpots === "number" && totalSpots <= 0)
      e.totalSpots = "Total spots must be > 0";

    if (!startDate) e.startAt = "Start date is required";
    if (!endDate) e.endAt = "End date is required";
    if (startDate && endDate) {
      const s = new Date(startDate).getTime();
      const t = new Date(endDate).getTime();
      if (s > t) e.startAt = "Start date must be before end date";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    if (!validate()) return;

    const startAt =
      startDate && startDate.trim()
        ? Math.floor(new Date(startDate + "T00:00:00Z").getTime() / 1000)
        : undefined;
    const endAt =
      endDate && endDate.trim()
        ? Math.floor(new Date(endDate + "T23:59:59Z").getTime() / 1000)
        : undefined;

    const payload: CreateContestPayload = {
      matchId: matchId || undefined,
      title: title.trim(),
      description: description?.trim() || undefined,
      type,
      difficulty,
      startAt,
      endAt,
      entryFee: entryFee === "" ? undefined : Number(entryFee),
      prizePool: prizePool === "" ? undefined : Number(prizePool),
      pointsPerQuestion:
        pointsPerQuestion === "" ? undefined : Number(pointsPerQuestion),
      questionsCount:
        questionsCount === "" ? undefined : Number(questionsCount),
      totalSpots: totalSpots === "" ? undefined : Number(totalSpots),
      displayEnabled,
      isPopular,
      joinDeadline,
      resultTime,
      timeCommitment: timeCommitment || undefined,
      platform: platform || undefined,
      status,
    };

    try {
      setBusy(true);
      await createContest(payload);
      setMessage("Contest created successfully");

      setTimeout(() => {
        navigate("/contest");
      }, 1000);
    } catch (err: unknown) {
      console.error("createContest error", err);
      setErrorMessage("Failed to create contest");
    } finally {
      setBusy(false);
      setTimeout(() => {
        setMessage(null);
        setErrorMessage(null);
      }, 4000);
    }
  };

  return (
    <>
      <PageMeta
        title="Create Contest | Wizplay Admin"
        description="Create a new cricket contest"
      />

      <div className="p-6 space-y-6">
        <PageBreadCrumb pageTitle="Create Contest" />

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6 lg:p-10">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Create Contest
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Fill in the details below to create a new contest
            </p>
          </div>

          {message && (
            <div className="mb-4 rounded-md bg-green-50 dark:bg-green-500/10 px-4 py-3 text-green-800 dark:text-green-300">
              {message}
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 rounded-md bg-red-50 dark:bg-red-500/10 px-4 py-3 text-red-800 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Match & Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Match
                </label>
                <select
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select a match (optional)</option>
                  {matchesLoading && <option>Loading matches...</option>}
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} {m.status ? `(${m.status})` : ""}
                    </option>
                  ))}
                </select>
                {matchesError && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {matchesError}
                  </div>
                )}
                <div className="flex items-center justify-end mt-2 text-xs text-gray-500">
                  <button
                    type="button"
                    onClick={loadMatches}
                    className="text-violet-600 hover:text-violet-700"
                  >
                    Refresh matches
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contest title"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
                {errors.title && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.title}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                rows={3}
              />
            </div>

            {/* Type, Difficulty, Platform */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) =>
                    setType(
                      e.target.value as "pre-match" | "live" | "post-match"
                    )
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                >
                  <option value="pre-match">Pre-match</option>
                  <option value="live">Live</option>
                  <option value="post-match">Post-match</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(
                      e.target.value as
                        | "beginner"
                        | "intermediate"
                        | "expert"
                    )
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Platform
                </label>
                <input
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="web / mobile / both"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Dates & Time Commitment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
                {errors.startAt && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.startAt}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
                {errors.endAt && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.endAt}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Commitment
                </label>
                <input
                  value={timeCommitment}
                  onChange={(e) => setTimeCommitment(e.target.value)}
                  placeholder="e.g. 10 minutes"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Entry Fee, Prize Pool, Points, Questions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entry Fee
                </label>
                <input
                  type="number"
                  min={0}
                  value={entryFee}
                  onChange={(e) =>
                    setEntryFee(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
                {errors.entryFee && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.entryFee}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prize Pool
                </label>
                <input
                  type="number"
                  min={0}
                  value={prizePool}
                  onChange={(e) =>
                    setPrizePool(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
                {errors.prizePool && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.prizePool}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Points / Question
                </label>
                <input
                  type="number"
                  min={1}
                  value={pointsPerQuestion}
                  onChange={(e) =>
                    setPointsPerQuestion(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Questions Count
                </label>
                <input
                  type="number"
                  min={1}
                  value={questionsCount}
                  onChange={(e) =>
                    setQuestionsCount(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Total Spots, Display, Popular */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Spots
                </label>
                <input
                  type="number"
                  min={1}
                  value={totalSpots}
                  onChange={(e) =>
                    setTotalSpots(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                />
                {errors.totalSpots && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.totalSpots}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Enabled
                </label>
                <select
                  value={displayEnabled ? "true" : "false"}
                  onChange={(e) => setDisplayEnabled(e.target.value === "true")}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Is Popular
                </label>
                <select
                  value={isPopular ? "true" : "false"}
                  onChange={(e) => setIsPopular(e.target.value === "true")}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>

            {/* Join Deadline, Result Time, Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Join Deadline
                </label>
                <select
                  value={joinDeadline}
                  onChange={(e) =>
                    setJoinDeadline(
                      e.target.value as "before_match" | "fixed_time"
                    )
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                >
                  <option value="before_match">Before Match</option>
                  <option value="fixed_time">Fixed Time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Result Time
                </label>
                <select
                  value={resultTime}
                  onChange={(e) =>
                    setResultTime(
                      e.target.value as "end_of_match" | "fixed_time"
                    )
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                >
                  <option value="end_of_match">End of Match</option>
                  <option value="fixed_time">Fixed Time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as
                        | "upcoming"
                        | "joining_closed"
                        | "live"
                        | "calculating"
                        | "completed"
                        | "cancelled"
                    )
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="joining_closed">Joining Closed</option>
                  <option value="live">Live</option>
                  <option value="calculating">Calculating</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate("/contest")}
                className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-6 py-2.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed font-medium text-sm"
              >
                {busy ? "Creating..." : "Create Contest"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
