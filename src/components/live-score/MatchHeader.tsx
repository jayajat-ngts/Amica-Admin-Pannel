import { Match } from "./types";
interface MatchHeaderProps {
  match: Match;
  isLive: boolean;
}

export default function MatchHeader({ match, isLive }: MatchHeaderProps) {
  const startTime = new Date(match.startTime.epoch * 1000).toLocaleString(
    "en-IN",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-violet-50 to-blue-50 dark:border-white/[0.05] dark:from-violet-950/30 dark:to-blue-950/30 p-6 md:p-8">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {match.title}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-2">
              📍 {match.venue.name}, {match.venue.city}
            </span>
            <span className="flex items-center gap-2">
              🏆 {match.tournament.name}
            </span>
            <span className="flex items-center gap-2">⏰ {startTime}</span>
          </div>
        </div>
        {isLive && (
          <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wider shadow-lg animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
            Live
          </div>
        )}
      </div>
    </div>
  );
}
