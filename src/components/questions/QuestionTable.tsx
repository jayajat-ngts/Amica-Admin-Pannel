import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  QuestionQuery,
  fetchQuestions,
  deleteQuestion,
  patchQuestion,
  ExtendedQuestion,
} from "../../api/questions";
import Badge from "../ui/badge/Badge";

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

export default function QuestionTable({ contestId }: { contestId?: string }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);

  const [data, setData] = useState<ExtendedQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busyRow, setBusyRow] = useState<string | null>(null);
  
  // Get contest/match info from first question
  const contestInfo = data[0]?.contestData;
  const matchInfo = data[0]?.matchData;

  const debounceMs = 500;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string | null>
  >({});

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit || 1)),
    [total, limit]
  );
  const currentPage = useMemo(
    () => Math.floor(offset / limit) + 1,
    [offset, limit]
  );

  const getOptionId = (opt: unknown, idx: number) => {
    if (opt === null || opt === undefined) return String(idx);
    if (typeof opt === "string") return opt;
    if (typeof opt === "object" && opt !== null) {
      const o = opt as Record<string, unknown>;
      return String(o.id ?? o.value ?? o.key ?? o.text ?? idx);
    }
    return String(opt);
  };
  const getOptionText = (opt: unknown) => {
    if (opt === null || opt === undefined) return "";
    if (typeof opt === "string") return opt;
    if (typeof opt === "object" && opt !== null) {
      const o = opt as Record<string, unknown>;
      return String(o.text ?? o.label ?? o.value ?? o.id ?? "");
    }
    return String(opt);
  };

  useEffect(() => {
    const map: Record<string, string | null> = {};
    for (const q of data) {
      map[q.id] = q.ansKey ? String(q.ansKey) : null;
    }
    setSelectedAnswers(map);
  }, [data]);

  const load = useCallback(
    async (opts?: { resetOffset?: boolean }) => {
      try {
        if (opts?.resetOffset) setOffset(0);
        setLoading(true);
        setErr(null);

        const q: QuestionQuery = {
          search: debouncedSearch?.trim() || undefined,
          contestId: contestId || undefined,
          limit,
          offset,
        };

        const res = await fetchQuestions(q);
        setData(res.items ?? []);
        setTotal(res.total ?? 0);
      } catch (e) {
        console.error("fetchQuestions error:", e);
        setErr("Failed to load questions");
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, contestId, limit, offset]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setOffset(0);
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;

    const isLastItemOnPage = data.length === 1;
    const willMoveBack = isLastItemOnPage && offset > 0;

    try {
      setBusyRow(id);
      await deleteQuestion(id);

      if (willMoveBack) {
        setOffset((o) => Math.max(0, o - limit));
        setTimeout(() => load(), 0);
      } else {
        await load();
      }
    } catch (e) {
      console.error("delete error", e);
      setErr("Failed to delete question");
    } finally {
      setBusyRow(null);
    }
  };

  const goPrev = () => {
    if (offset <= 0) return;
    setOffset((o) => Math.max(0, o - limit));
  };

  const goNext = () => {
    if (offset + limit >= total) return;
    setOffset((o) => o + limit);
  };

  const handleChangeCorrect = async (
    questionId: string,
    optionId: string | null
  ) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setBusyRow(questionId);

    try {
      await patchQuestion(questionId, { ansKey: optionId });
    } catch (err) {
      console.error("Failed to update correct answer", err);
      setSelectedAnswers((prev) => {
        const q = data.find((x) => x.id === questionId);
        const initial = q?.ansKey ?? null;
        return { ...prev, [questionId]: initial ? String(initial) : null };
      });
      setErr("Failed to save correct answer");
    } finally {
      setBusyRow(null);
    }
  };

  const handleToggleDisplay = async (questionId: string) => {
    const q = data.find((x) => x.id === questionId);
    if (!q) return;
    const prev = q.displayOnFrontend ?? false;
    const next = !prev;

    setData((d) =>
      d.map((it) =>
        it.id === questionId ? { ...it, displayOnFrontend: next } : it
      )
    );
    setBusyRow(questionId);

    try {
      await patchQuestion(questionId, { displayOnFrontend: next });
    } catch (e) {
      console.error("Failed to update displayOnFrontend", e);
      setData((d) =>
        d.map((it) =>
          it.id === questionId ? { ...it, displayOnFrontend: prev } : it
        )
      );
      setErr("Failed to update visibility");
    } finally {
      setBusyRow(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Contest/Match Info Header */}
      {(contestId) && (
        <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Left: Contest Info */}
            <div>
              {contestInfo && (
                <div className="mb-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {contestInfo.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {contestInfo.description}
                  </p>
                </div>
              )}
              
              {matchInfo && (
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
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      matchInfo.status === 'completed' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : matchInfo.status === 'running'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {matchInfo.status}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right: Contest Stats */}
            {contestInfo && (
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Entry Fee</div>
                  <div className="text-lg font-bold text-violet-600 dark:text-violet-400">
                    {contestInfo.entryFee === 0 ? 'Free' : `${contestInfo.entryFee}`}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Prize Pool</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {contestInfo.prizePool}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Questions</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {total}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex-1 md:flex-none w-full md:w-auto">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 md:flex-none md:w-80">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions…"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                aria-label="Search questions"
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

        <div className="flex-shrink-0">
          <button
            onClick={() => {
              if (contestId) {
                navigate(`/questions/${contestId}/create`);
              } else {
                navigate("/questions/create");
              }
            }}
            className="h-10 rounded-lg bg-violet-600 px-5 text-sm font-medium text-white hover:bg-violet-700 active:bg-violet-800 transition shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Question
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800/50">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 text-left">
                Question / Options
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 text-left">
                Correct Answer
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">
                Points
              </TableCell>
              {/* <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">
                Visible
              </TableCell> */}
              <TableCell isHeader className="px-5 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {err && (
              <TableRow>
                <TableCell
                  className="px-5 py-4 text-sm text-red-600 dark:text-red-400"
                  colSpan={7}
                >
                  {err}
                </TableCell>
              </TableRow>
            )}

            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <LoadingRow key={i} />)
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-6 text-gray-500 dark:text-gray-400" colSpan={7}>
                  No questions found
                </TableCell>
              </TableRow>
            ) : (
              data.map((q) => {
                const isBusy = busyRow === q.id;
                const opts: unknown[] = Array.isArray(q.options)
                  ? q.options
                  : [];
                const selected = selectedAnswers[q.id] ?? null;

                return (
                  <TableRow key={q.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                    
                    <TableCell className="px-5 py-4 text-left">
                      <div className="flex flex-col items-start space-y-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {q.question}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {opts.map((o, idx) => {
                            const id = getOptionId(o, idx);
                            const isCorrect = id === q.ansKey;
                            return (
                              <span
                                key={id}
                                className={`text-xs px-2 py-1 rounded-md ${
                                  isCorrect
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {id}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-5 py-4 text-left">
                      {opts.length > 0 ? (
                        <div className="flex items-left justify-left gap-2">
                          <select
                            value={selected ? selected : q.ansKey ?? ""}
                            onChange={(e) =>
                              handleChangeCorrect(
                                q.id,
                                e.target.value === "" ? null : e.target.value
                              )
                            }
                            disabled={isBusy}
                            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          >
                            <option value="">Select answer</option>
                            {opts.map((o, idx) => {
                              const id = getOptionId(o, idx);
                              const text = getOptionText(o);
                              return (
                                <option key={id} value={id}>
                                  {text || `Option ${idx + 1}`}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          No options
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-semibold text-sm">
                        {typeof q.points === "number" ? q.points : "—"}
                      </span>
                    </TableCell>

                    <TableCell className="px-5 py-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          disabled={isBusy}
                          onClick={() => handleDelete(q.id)}
                          className={`rounded-md bg-red-50 px-3 py-1 text-xs text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 ${
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

      <div className="p-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Page {currentPage} of {totalPages} • {total} results
        </div>
        <div className="flex gap-2">
          <button
            onClick={goPrev}
            disabled={loading || offset <= 0}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            Previous
          </button>
          <button
            onClick={goNext}
            disabled={loading || offset + limit >= total}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
