interface ConnectionStatusProps {
  connected: boolean;
}

export default function ConnectionStatus({ connected }: ConnectionStatusProps) {
  return (
    <div className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 z-50">
      <div
        className={`w-3 h-3 rounded-full ${
          connected
            ? "bg-green-500 animate-pulse"
            : "bg-red-500"
        }`}
      />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {connected ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
}
