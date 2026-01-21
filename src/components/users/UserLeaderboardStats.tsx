import { useEffect, useState } from "react";
import { 
  fetchUserLeaderboardHistory, 
  LeaderboardHistoryEntry, 
  PerformanceStats 
} from "../../api/contests";

export default function UserLeaderboardStats({ userId }: { userId: string }) {
  const [recentEntries, setRecentEntries] = useState<LeaderboardHistoryEntry[]>([]);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaderboardHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUserLeaderboardHistory(userId, 10);
        setRecentEntries(data.recentEntries);
        setStats(data.stats);
      } catch (err: any) {
        console.error("Failed to fetch leaderboard history:", err);
        setError(err.message || "Failed to load leaderboard history");
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboardHistory();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-red-500 dark:text-red-400 text-lg">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">No leaderboard data available</p>
      </div>
    );
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    if (rank <= 10) return "🔟";
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="p-6 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">
              {stats.averageRank}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Average Rank</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {getRankBadge(stats.bestRank)} {stats.bestRank}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Best Rank</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.percentile}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Percentile</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {stats.winRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Win Rate</div>
          </div>
        </div>
      </div>

      {/* Achievement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏆</div>
            <div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.top3Finishes}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-500">Top 3 Finishes</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎯</div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.top10Finishes}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-500">Top 10 Finishes</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="text-3xl">📈</div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalScore.toLocaleString()}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-500">Total Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Leaderboard Entries */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Contest Rankings
        </h3>
        <div className="space-y-3">
          {recentEntries.map((entry) => (
            <div
              key={entry.contestId}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/30 hover:shadow-md transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Contest Info */}
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    {entry.contestName}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                      {entry.matchInfo}
                    </span>
                    <span>•</span>
                    <span>{new Date(entry.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{entry.totalParticipants} players</span>
                  </div>
                </div>

                {/* Performance */}
                <div className="flex gap-6 items-center">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rank</div>
                    <div className="text-xl font-bold text-violet-600 dark:text-violet-400">
                      {getRankBadge(entry.rank)} #{entry.rank}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Score</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {entry.score}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Percentile</div>
                    <div className="text-lg font-medium text-green-600 dark:text-green-400">
                      {Math.round(((entry.totalParticipants - entry.rank) / entry.totalParticipants) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="flex-1">
            <div className="font-semibold text-green-900 dark:text-green-300 mb-2">
              Performance Insights
            </div>
            <div className="space-y-1 text-sm text-green-800 dark:text-green-400">
              {stats.percentile >= 80 && (
                <div>✅ Excellent performance! You're in the top 20% of all players.</div>
              )}
              {stats.top3Finishes > 0 && (
                <div>🏆 You've achieved {stats.top3Finishes} podium finishes!</div>
              )}
              {stats.averageRank <= 15 && (
                <div>🎯 Consistently strong rankings with an average of {stats.averageRank}.</div>
              )}
              {stats.winRate >= 20 && (
                <div>📊 Great win rate of {stats.winRate}% in contests entered.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
