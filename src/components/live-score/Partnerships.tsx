import { Innings } from "./types";

interface PartnershipsProps {
  innings: Innings[];
}

export default function Partnerships({ innings }: PartnershipsProps) {
  const hasPartnerships = innings?.some((inn) => inn?.partnerships && inn.partnerships.length > 0);

  if (!hasPartnerships) {
    return (
      <div className="p-12 text-center">
        <div className="text-6xl mb-4 opacity-50">📊</div>
        <p className="text-gray-500 dark:text-gray-400">
          No partnership data available
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {innings.map((inn) => {
        if (!inn?.partnerships || inn.partnerships.length === 0) return null;

        return (
          <div key={inn.id}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-violet-600 rounded"></span>
              {inn.teamName || "Unknown Team"}
            </h3>
            <div className="space-y-3">
              {inn.partnerships.map((partnership, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-violet-500 bg-violet-50 dark:bg-violet-950/20 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white mb-2">
                        <span className="text-violet-600 dark:text-violet-400">
                          {partnership.player1?.name || "Unknown"}
                        </span>{" "}
                        ({partnership.player1?.runs ?? 0} runs, {partnership.player1?.balls ?? 0}{" "}
                        balls) &{" "}
                        <span className="text-violet-600 dark:text-violet-400">
                          {partnership.player2?.name || "Unknown"}
                        </span>{" "}
                        ({partnership.player2?.runs ?? 0} runs, {partnership.player2?.balls ?? 0}{" "}
                        balls)
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Run Rate: {partnership.runRate?.toFixed(2) ?? "0.00"} •{" "}
                        {partnership.completed ? "Completed" : "Current"}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      {partnership.runs ?? 0} runs
                      <span className="block text-sm text-gray-600 dark:text-gray-400">
                        ({partnership.balls ?? 0} balls)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
