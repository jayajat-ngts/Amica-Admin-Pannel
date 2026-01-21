import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { io } from "socket.io-client";
import PageMeta from "../common/PageMeta";
import MatchHeader from "./MatchHeader";
import ScoreSection from "./ScoreSection";
import CurrentPlayers from "./CurrentPlayers";
import Tabs from "./Tabs";
import Scorecard from "./Scorecard";
import Partnerships from "./Partnerships";
import FallOfWickets from "./FallOfWickets";
import Commentary from "./Commentary";
import ConnectionStatus from "./ConnectionStatus";
import { MatchData } from "./types";

const HOST = import.meta.env.VITE_SOCKET_URL || "https://wizplay-api.ngtsindore.in/";

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

export default function LiveScorePage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [activeTab, setActiveTab] = useState<string>("scorecard");
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!matchId) return;

    setConnectionState("connecting");
    setErrorMessage("");

    const socketInstance = io(HOST, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketInstance.on("connect", () => {
      setConnectionState("connected");
      setErrorMessage("");
      socketInstance.emit("join", matchId);
    });

    socketInstance.on("disconnect", () => {
      setConnectionState("disconnected");
    });

    socketInstance.on("match_update", (payload: MatchData) => {
      setMatchData(payload);
    });

    socketInstance.on("live_update", (payload: MatchData) => {
      setMatchData(payload);
    });

    socketInstance.on("connect_error", (error) => {
      setConnectionState("error");
      setErrorMessage(error?.message || "Failed to connect to live score server");
    });

    socketInstance.on("error", (error) => {
      setErrorMessage(error?.message || "An error occurred");
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [matchId]);

  // No matchId provided
  if (!matchId) {
    return (
      <>
        <PageMeta
          title="Live Score | Wizplay Admin"
          description="Watch live cricket match scores and updates"
        />
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">🏏</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No Match Selected
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please select a match from the matches list to view the live score.
            </p>
            <button
              onClick={() => navigate("/matches")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors"
            >
              <span>Browse Matches</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </>
    );
  }

  // Connection error state
  if (connectionState === "error") {
    return (
      <>
        <PageMeta
          title="Live Score | Wizplay Admin"
          description="Watch live cricket match scores and updates"
        />
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Connection Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Unable to connect to the live score server.
            </p>
            {errorMessage && (
              <p className="text-sm text-red-500 dark:text-red-400 mb-6">
                {errorMessage}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Retry</span>
              </button>
              <button
                onClick={() => navigate("/matches")}
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
              >
                <span>Back to Matches</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Loading state - connecting or waiting for data
  if (!matchData) {
    return (
      <>
        <PageMeta
          title="Live Score | Wizplay Admin"
          description="Watch live cricket match scores and updates"
        />
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {connectionState === "connecting" 
                ? "Connecting to live server..." 
                : "Loading match data..."}
            </p>
            {connectionState === "disconnected" && (
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                Reconnecting...
              </p>
            )}
          </div>
        </div>
      </>
    );
  }

  // Check if match data is valid
  const hasValidMatch = matchData.match?.title;
  const hasInnings = matchData.innings && matchData.innings.length > 0;

  // Invalid or empty match data
  if (!hasValidMatch) {
    return (
      <>
        <PageMeta
          title="Live Score | Wizplay Admin"
          description="Watch live cricket match scores and updates"
        />
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">📭</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Match Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The match you're looking for doesn't exist or the data is unavailable.
            </p>
            <button
              onClick={() => navigate("/matches")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors"
            >
              <span>Browse Matches</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </>
    );
  }

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "scorecard":
        return hasInnings ? (
          <Scorecard innings={matchData.innings} extras={matchData.extras ?? {}} />
        ) : (
          <EmptyState 
            icon="📊" 
            title="No Scorecard Available" 
            message="The scorecard will appear once the match begins." 
          />
        );
      case "partnerships":
        return hasInnings ? (
          <Partnerships innings={matchData.innings} />
        ) : (
          <EmptyState 
            icon="🤝" 
            title="No Partnerships" 
            message="Partnership data will appear as the match progresses." 
          />
        );
      case "fow":
        return matchData.fallOfWickets && matchData.fallOfWickets.length > 0 ? (
          <FallOfWickets fallOfWickets={matchData.fallOfWickets} />
        ) : (
          <EmptyState 
            icon="🏏" 
            title="No Wickets Fallen" 
            message="Fall of wickets will appear here when wickets fall." 
          />
        );
      case "commentary":
        return matchData.live?.commentary && matchData.live.commentary.length > 0 ? (
          <Commentary commentary={matchData.live.commentary} />
        ) : (
          <EmptyState 
            icon="📝" 
            title="No Commentary Available" 
            message="Live commentary will appear here during the match." 
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <PageMeta
        title={`${matchData.match.title} - Live Score | Wizplay Admin`}
        description="Watch live cricket match scores and updates"
      />

      <div className="space-y-5">
        <MatchHeader match={matchData.match} isLive={matchData.live !== null} />
        
        {hasInnings ? (
          <ScoreSection 
            innings={matchData.innings} 
            battingTeam={matchData.live?.battingTeam} 
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-8 text-center">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-gray-600 dark:text-gray-400">
              Match hasn't started yet. Score will appear once the match begins.
            </p>
          </div>
        )}

        {matchData.live ? (
          <CurrentPlayers live={matchData.live} />
        ) : hasInnings ? (
          <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-950/20 p-6 text-center">
            <div className="text-2xl mb-2">⏸️</div>
            <p className="text-amber-700 dark:text-amber-400 font-medium">
              Match is currently not live
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
              Live player stats will appear when the match is in progress.
            </p>
          </div>
        ) : null}

        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          {renderTabContent()}
        </div>

        <ConnectionStatus connected={connectionState === "connected"} />
      </div>
    </>
  );
}

// Empty state component for reusability
interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
}

function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <div className="p-12 text-center">
      <div className="text-6xl mb-4 opacity-50">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        {message}
      </p>
    </div>
  );
}
