interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  const tabs = [
    { id: "scorecard", label: "Scorecard" },
    { id: "partnerships", label: "Partnerships" },
    { id: "fow", label: "Fall of Wickets" },
    { id: "commentary", label: "Commentary" },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === tab.id
              ? "bg-violet-600 text-white shadow-lg dark:bg-violet-500"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
