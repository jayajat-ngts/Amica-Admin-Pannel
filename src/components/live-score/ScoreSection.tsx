import { Innings } from "./types";
import Badge from "../ui/badge/Badge";

interface ScoreSectionProps {
  innings: Innings[];
  battingTeam?: string;
}

export default function ScoreSection({ innings, battingTeam }: ScoreSectionProps) {
  // Handle empty or undefined innings
  if (!innings || innings.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-8 text-center">
        <div className="text-4xl mb-3 opacity-50">📊</div>
        <p className="text-gray-600 dark:text-gray-400">
          No innings data available yet
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {innings.map((inn) => {
        const isBatting = battingTeam === inn.teamName;
        const hasScore = inn.score !== null && inn.score !== undefined;
        
        return (
          <div
            key={inn.id}
            className={`overflow-hidden rounded-xl border p-6 transition-all hover:shadow-lg ${
              isBatting
                ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-500/50 dark:from-green-950/20 dark:to-emerald-950/20"
                : "border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {inn.teamName || "Unknown Team"}
                  {inn.teamCode && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      ({inn.teamCode})
                    </span>
                  )}
                </h3>
                {isBatting && (
                  <Badge size="sm" color="success">
                    BATTING
                  </Badge>
                )}
              </div>
            </div>
            
            {hasScore ? (
              <>
                <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                  {inn.score.runs ?? 0}/{inn.score.wickets ?? 0}
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Overs: {inn.score.overs ?? "0.0"}</span>
                  <span>RR: {typeof inn.score.runRate === "number" ? inn.score.runRate.toFixed(2) : "0.00"}</span>
                  <span>Extras: {inn.score.extras ?? 0}</span>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">
                  Yet to bat
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
