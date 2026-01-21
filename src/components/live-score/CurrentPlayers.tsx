import { LiveData } from "./types";

interface CurrentPlayersProps {
  live: LiveData;
}

export default function CurrentPlayers({ live }: CurrentPlayersProps) {
  const displayBall = (b: { repr: string; runs: number; isWicket: boolean; isBoundary: boolean; isExtra: boolean }) => {
    const r = (b.repr ?? "").toLowerCase();
    if (b.isWicket) return "W";
    if (r.startsWith("wd")) return "WD";
    if (r.startsWith("nb")) return "NB";
    if (r.startsWith("lb")) return r.slice(2) || "LB";
    if (/^b(?![46])/.test(r)) return r.slice(1) || "B";
    if (b.runs === 6) return "6";
    if (b.isBoundary && b.runs === 4) return "4";
    if (b.runs === 0) return "•";
    return String(b.runs ?? 0);
  };

  // Check if we have valid player data
  const hasStriker = live?.striker && (live.striker.name || live.striker.runs !== undefined || live.striker.balls !== undefined);
  const hasNonStriker = live?.nonStriker && (live.nonStriker.name || live.nonStriker.runs !== undefined || live.nonStriker.balls !== undefined);
  const hasBowler = live?.bowler && (live.bowler.name || live.bowler.overs || live.bowler.wickets !== undefined);
  const hasRecentOvers = live?.recentOvers && live.recentOvers.length > 0;

  // Check if live object has any meaningful data
  const hasAnyLiveData = hasStriker || hasNonStriker || hasBowler || hasRecentOvers;

  if (!hasAnyLiveData) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-8 text-center">
        <div className="text-4xl mb-3 opacity-50">🏏</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Players at Crease
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Player information will appear when the match is in progress.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-violet-600 rounded"></span>
        At The Crease
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Striker */}
        {hasStriker ? (
          <div className="border-l-4 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Striker
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              {live.striker?.name || "Unknown Batsman"}
            </div>
            <div className="flex gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Runs</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {live.striker?.runs ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Balls</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {live.striker?.balls ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">SR</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {typeof live.striker?.strikeRate === "number" ? live.striker.strikeRate.toFixed(1) : "0.0"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-l-4 border-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Striker
            </div>
            <div className="text-gray-400 dark:text-gray-500 italic">
              Awaiting player
            </div>
          </div>
        )}

        {/* Non-Striker */}
        {hasNonStriker ? (
          <div className="border-l-4 border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Non-Striker
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              {live.nonStriker?.name || "Unknown Batsman"}
            </div>
            <div className="flex gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Runs</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {live.nonStriker?.runs ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Balls</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {live.nonStriker?.balls ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">SR</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {typeof live.nonStriker?.strikeRate === "number" ? live.nonStriker.strikeRate.toFixed(1) : "0.0"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-l-4 border-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Non-Striker
            </div>
            <div className="text-gray-400 dark:text-gray-500 italic">
              Awaiting player
            </div>
          </div>
        )}

        {/* Bowler */}
        {hasBowler ? (
          <div className="border-l-4 border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Bowler
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              {live.bowler?.name || "Unknown Bowler"}
            </div>
            <div className="flex gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Overs</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {live.bowler?.overs ?? "0.0"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Wickets</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {live.bowler?.wickets ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Eco</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {typeof live.bowler?.economy === "number" ? live.bowler.economy.toFixed(2) : "0.00"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-l-4 border-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Bowler
            </div>
            <div className="text-gray-400 dark:text-gray-500 italic">
              Awaiting bowler
            </div>
          </div>
        )}
      </div>

      {/* Recent Balls */}
      {live.recentOvers && live.recentOvers.length > 0 ? (
        <>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Recent Balls
          </h3>
          <div className="flex flex-wrap gap-2">
            {(live.recentOvers[live.recentOvers.length - 1]?.ballDetails ?? []).map((ball, idx) => {
              const displayText = displayBall(ball);
              let bgClass = "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white";
              
              if (ball.isWicket) {
                bgClass = "bg-red-600 text-white shadow-lg";
              } else if (ball.runs === 6) {
                bgClass = "bg-purple-600 text-white shadow-lg";
              } else if (ball.isBoundary && ball.runs === 4) {
                bgClass = "bg-green-600 text-white shadow-lg";
              }

              return (
                <div
                  key={idx}
                  className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg font-bold text-sm transition-transform hover:scale-110 ${bgClass}`}
                >
                  {displayText}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Recent Balls
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No ball-by-ball data available yet
          </p>
        </div>
      )}
    </div>
  );
}
