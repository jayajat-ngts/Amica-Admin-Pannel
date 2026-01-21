import { CommentaryItem } from "./types";

interface CommentaryProps {
  commentary: CommentaryItem[];
}

export default function Commentary({ commentary }: CommentaryProps) {
  if (commentary.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="text-6xl mb-4 opacity-50">📝</div>
        <p className="text-gray-500 dark:text-gray-400">
          No commentary available
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-violet-600 rounded"></span>
        Commentary
      </h3>
      <div className="space-y-3">
        {commentary?.map((item, idx) => (
          <div
            key={idx}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <div className="flex justify-between items-start mb-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Over {item?.over ?? "0.0"}</span>
              <span>
                {item?.bowler && <span>{item.bowler}</span>}
                {item?.bowler && item?.batsman && <span className="mx-2">•</span>}
                {item?.batsman && <span>{item.batsman}</span>}
              </span>
            </div>
            <div className="text-gray-900 dark:text-white font-medium">
              {item?.text || item?.repr || "No commentary"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
