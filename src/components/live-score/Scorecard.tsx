import { Innings, Extras } from "./types";

interface ScorecardProps {
  innings: Innings[];
  extras: Extras;
}

export default function Scorecard({ innings, extras }: ScorecardProps) {
  // Handle empty innings array
  if (!innings || innings.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="text-6xl mb-4 opacity-50">📊</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Scorecard Available
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Scorecard data will appear once the match begins.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {innings?.map((inn) => {
        const hasBatting = inn?.batting && inn.batting.length > 0;
        const hasBowling = inn?.bowling && inn.bowling.length > 0;
        const extrasData = extras?.[inn?.id];
        
        return (
          <div key={inn.id}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-violet-600 rounded"></span>
              {inn.teamName || "Unknown Team"} - Innings {inn.innings_number ?? 1}
            </h3>

            {/* Batting */}
            <h4 className="text-lg font-semibold text-violet-600 dark:text-violet-400 mb-3">
              Batting
            </h4>
            {hasBatting ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Batsman
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        R
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        B
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        4s
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        6s
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        SR
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {inn.batting?.map((bat, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {bat?.name || "Unknown"}
                          </div>
                          {bat?.dismissal && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                              {bat.dismissal}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-violet-600 dark:text-violet-400">
                          {bat?.runs ?? 0}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {bat?.balls ?? 0}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {bat?.fours ?? 0}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {bat?.sixes ?? 0}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {typeof bat?.strikeRate === "number" ? bat.strikeRate.toFixed(1) : "0.0"}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 dark:bg-gray-800/70 font-semibold">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">Extras</td>
                      <td className="px-4 py-3 text-center font-bold text-violet-600 dark:text-violet-400">
                        {inn.score?.extras ?? 0}
                      </td>
                      <td colSpan={4} className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {extrasData
                          ? `b ${extrasData.byes ?? 0}, lb ${extrasData.legByes ?? 0}, wd ${extrasData.wides ?? 0}, nb ${extrasData.noBalls ?? 0}`
                          : "No extras data"}
                      </td>
                    </tr>
                    <tr className="bg-violet-100 dark:bg-violet-900/30 font-bold">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">Total</td>
                      <td className="px-4 py-3 text-center font-bold text-violet-600 dark:text-violet-400">
                        {inn.score?.runs ?? 0}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                        {inn.score?.wickets ?? 0} wkts
                      </td>
                      <td colSpan={3} className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {inn.score?.overs ?? "0.0"} overs
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 text-center mb-4">
                <p className="text-gray-500 dark:text-gray-400">
                  No batting data available yet
                </p>
              </div>
            )}

            {/* Bowling */}
            <h4 className="text-lg font-semibold text-violet-600 dark:text-violet-400 mt-6 mb-3">
              Bowling
            </h4>
            {hasBowling ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Bowler
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        O
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        M
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        R
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        W
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Econ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {inn.bowling?.map((bowl, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                      >
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                          {bowl?.name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {bowl?.overs ?? "0.0"}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {bowl?.maidens ?? 0}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {bowl?.runs ?? 0}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-violet-600 dark:text-violet-400">
                          {bowl?.wickets ?? 0}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {typeof bowl?.economy === "number" ? bowl.economy.toFixed(2) : "0.00"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No bowling data available yet
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
