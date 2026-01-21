import { FallOfWicket } from "./types";

interface FallOfWicketsProps {
  fallOfWickets: FallOfWicket[];
}

export default function FallOfWickets({ fallOfWickets }: FallOfWicketsProps) {
  if (fallOfWickets.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="text-6xl mb-4 opacity-50">🏏</div>
        <p className="text-gray-500 dark:text-gray-400">
          No wickets fallen yet
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-violet-600 rounded"></span>
        Fall of Wickets
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Player Out
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Score
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Overs
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Dismissal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {fallOfWickets?.map((fow, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
              >
                <td className="px-4 py-3 text-center font-bold text-violet-600 dark:text-violet-400">
                  {fow?.wicketNumber ?? 0}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                  {fow?.playerOut || "Unknown"}
                </td>
                <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                  {fow?.runs ?? 0}
                </td>
                <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                  {fow?.overs ?? "0.0"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 italic">
                  {fow?.dismissal || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
