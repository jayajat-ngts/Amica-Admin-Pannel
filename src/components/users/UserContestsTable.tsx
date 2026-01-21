import { useEffect, useState } from "react";
import { fetchUserContestHistory, UserContestDetail } from "../../api/contests";
import { Modal } from "../ui/modal";

export default function UserContestsTable({ userId }: { userId: string }) {
  const [contests, setContests] = useState<UserContestDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(5);

  // Modal state
  const [prizeModalOpen, setPrizeModalOpen] = useState(false);
  const [selectedContest, setSelectedContest] = useState<UserContestDetail | null>(null);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(contests.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedContests = contests.slice(startIndex, endIndex);

  useEffect(() => {
    const loadContests = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUserContestHistory(userId);
        setContests(data);
      } catch (err: unknown) {
        console.error("Failed to fetch user contests:", err);
        setError((err as Error).message || "Failed to load contests");
      } finally {
        setLoading(false);
      }
    };

    loadContests();
  }, [userId]);

  const goPrev = () => {
    if (page <= 1) return;
    setPage((p) => p - 1);
  };

  const goNext = () => {
    if (page >= totalPages) return;
    setPage((p) => p + 1);
  };

  const handleViewDetails = (contest: UserContestDetail) => {
    setSelectedContest(contest);
    setPrizeModalOpen(true);
  };

  const closePrizeModal = () => {
    setPrizeModalOpen(false);
    setSelectedContest(null);
  };

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

  if (contests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">No contests joined yet</p>
      </div>
    );
  }

  // Helper function to get match info from match data
  const getMatchInfo = (contest: UserContestDetail) => {
    if (contest.matchData?.teams?.a?.name && contest.matchData?.teams?.b?.name) {
      return `${contest.matchData.teams.a.name} vs ${contest.matchData.teams.b.name}`;
    }
    return contest.matchInfo || "Unknown Match";
  };

  return (
    <div className="space-y-4">
      {paginatedContests.map((contest) => (
        <div
          key={contest.id}
          className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:shadow-md transition"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Contest Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {contest.contestTitle}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    contest.status === "completed"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : contest.status === "ongoing"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {contest.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span>🏏 {getMatchInfo(contest)}</span>
                <span>•</span>
                <span>💰 Entry: {contest.entryFee === 0 ? "Free" : `${contest.entryFee} pts`}</span>
                <span>•</span>
                <span>👥 {contest.totalParticipants} participants</span>
                <span>•</span>
                <span>📅 {new Date(contest.joinedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
              {contest.rank && (
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Rank</div>
                  <div className={`text-xl font-bold ${
                    contest.rank <= 3 
                      ? "text-yellow-600 dark:text-yellow-400" 
                      : "text-gray-900 dark:text-white"
                  }`}>
                    {contest.rank === 1 ? "🥇" : contest.rank === 2 ? "🥈" : contest.rank === 3 ? "🥉" : `#${contest.rank}`}
                  </div>
                </div>
              )}
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">Score</div>
                <div className="text-xl font-bold text-violet-600 dark:text-violet-400">
                  {contest.score}
                </div>
              </div>
              {contest.prize > 0 && (
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Prize Won</div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {contest.prize}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div>
              <button
                onClick={() => handleViewDetails(contest)}
                className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 text-sm font-medium transition"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination Controls */}
      {contests.length > pageSize && (
        <div className="p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Page {page} of {totalPages} • Showing {startIndex + 1}-{Math.min(endIndex, contests.length)} of {contests.length} contests
          </div>

          <div className="flex gap-2">
            <button
              onClick={goPrev}
              disabled={page <= 1}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition"
            >
              ← Previous
            </button>

            <button
              onClick={goNext}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Contests</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{contests.length}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {contests.filter((c) => c.status === "completed").length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Winnings</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {contests.reduce((sum, c) => sum + c.prize, 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">Top 3 Finishes</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {contests.filter((c) => c.rank && c.rank <= 3).length}
            </div>
          </div>
        </div>
      </div>

      {/* Prize Pool Modal */}
      <Modal
        isOpen={prizeModalOpen}
        onClose={closePrizeModal}
        className="max-w-[800px] p-0"
      >
        <div className="flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Contest Details
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedContest?.contestTitle}
                </p>
              </div>
              <button
                onClick={closePrizeModal}
                className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800 transition"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedContest && (
              <div className="space-y-6">
                {/* Contest Overview */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Contest Overview</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Match</span>
                      <p className="font-medium text-gray-900 dark:text-white">{getMatchInfo(selectedContest)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Entry Fee</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedContest.entryFee === 0 ? "Free" : `${selectedContest.entryFee} pts`}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Total Participants</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedContest.totalParticipants}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
                      <p className={`font-medium capitalize ${
                        selectedContest.status === "completed"
                          ? "text-green-600 dark:text-green-400"
                          : selectedContest.status === "ongoing"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}>
                        {selectedContest.status}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Your Performance */}
                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 border border-violet-200 dark:border-violet-800">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Your Performance</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your Rank</div>
                      <div className={`text-2xl font-bold ${
                        selectedContest.rank && selectedContest.rank <= 3 
                          ? "text-yellow-600 dark:text-yellow-400" 
                          : "text-gray-900 dark:text-white"
                      }`}>
                        {selectedContest.rank 
                          ? selectedContest.rank === 1 ? "🥇" 
                            : selectedContest.rank === 2 ? "🥈" 
                            : selectedContest.rank === 3 ? "🥉" 
                            : `#${selectedContest.rank}`
                          : "N/A"
                        }
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your Score</div>
                      <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                        {selectedContest.score}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Prize Won</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedContest.prize > 0 ? selectedContest.prize : "0"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prize Pool Information */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Prize Pool</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Prize Pool</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedContest.totalParticipants * selectedContest.entryFee} pts
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Your Prize Share</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {selectedContest.prize > 0 ? `${selectedContest.prize} pts` : "No prize"}
                      </span>
                    </div>
                    {selectedContest.prize > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Prize Percentage</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {((selectedContest.prize / (selectedContest.totalParticipants * selectedContest.entryFee)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Additional Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Joined Date</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedContest.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Contest ID</span>
                      <span className="font-mono text-sm text-gray-900 dark:text-white">
                        {selectedContest.contestId}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Contest details and prize information
              </div>
              <button
                onClick={closePrizeModal}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
