import { useNavigate, useSearchParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import MatchesTable from "../../components/matches/MatchesTable";
import MatchesCalendar from "../../components/matches/MatchesCalendar";
import { ApiMatch } from "../../api/matches";

export default function Matches() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get active tab from URL or default to 'list'
  const activeTab = searchParams.get("view") || "calendar";
  const filterDate = searchParams.get("date") || "";

  const setActiveTab = (tab: string) => {
    const params: Record<string, string> = { view: tab };
    if (filterDate && tab === "list") {
      params.date = filterDate;
    }
    setSearchParams(params);
  };

  const handleDateClick = (dateStr: string) => {
    // Switch to list view and filter by date
    setSearchParams({ view: "list", date: dateStr });
  };

  const handleMatchClick = (match: ApiMatch) => {
    // Navigate to match details/contest
    navigate(`/contest/${match.id}`);
  };

  return (
    <>
      <PageMeta
        title="Wizplay Dashboard | Matches Overview"
        description="Track total, upcoming, and live matches on the Wizplay admin dashboard."
      />
      <PageBreadcrumb pageTitle="Matches" />
      <div className="space-y-6">
        <ComponentCard title="Match Management">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
            <nav className="-mb-px flex gap-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("calendar")}
                className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${activeTab === "calendar"
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Calendar View
                </div>
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${activeTab === "list"
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  List View
                </div>
              </button>

            </nav>
          </div>

          {/* Content based on active tab */}
          {activeTab === "list" && <MatchesTable filterDate={filterDate} />}
          {activeTab === "calendar" && (
            <MatchesCalendar
              onDateClick={handleDateClick}
              onMatchClick={handleMatchClick}
            />
          )}
        </ComponentCard>
      </div>
    </>
  );
}
