import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, EventContentArg } from "@fullcalendar/core";
import { ApiMatch, fetchMatches } from "../../api/matches";

interface MatchCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    matchKey: string;
    status: string;
    format: string;
    tournament?: string;
    shortName?: string;
    fullMatch: ApiMatch;
  };
}

interface MatchesCalendarProps {
  onDateClick?: (dateStr: string) => void;
  onMatchClick?: (match: ApiMatch) => void;
}

const statusColors: Record<string, { bg: string; border: string }> = {
  not_started: { bg: "#6B7280", border: "#4B5563" },
  started: { bg: "#3B82F6", border: "#2563EB" },
  completed: { bg: "#F59E0B", border: "#D97706" },
  abandoned: { bg: "#EF4444", border: "#DC2626" },
  cancelled: { bg: "#EF4444", border: "#DC2626" },
};

export default function MatchesCalendar({
  onDateClick,
  onMatchClick,
}: MatchesCalendarProps) {
  const [events, setEvents] = useState<MatchCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const res = await fetchMatches({
        sport: "cricket",
        limit: 1000,
        status: "all",
      });

      const calendarEvents: MatchCalendarEvent[] = res.items
        .filter((m) => m.startedAt || m.expectedStartedAt)
        .map((match) => {
          const start =
            (match.startedAt || match.expectedStartedAt || 0) * 1000;
          const end = match.endedAt
            ? match.endedAt * 1000
            : start + 3 * 60 * 60 * 1000;

          const status = match.status || "not_started";
          const colors = statusColors[status] || statusColors.not_started;

          return {
            id: match.id,
            title: match.shortName || match.name,
            start: new Date(start),
            end: new Date(end),
            backgroundColor: colors.bg,
            borderColor: colors.border,
            textColor: "#ffffff",
            extendedProps: {
              matchKey: match.key,
              status,
              format: match.format || "t20",
              tournament: match.tournamentKey,
              shortName: match.shortName,
              fullMatch: match,
            },
          };
        });

      setEvents(calendarEvents);
    } catch (err) {
      console.error("Calendar load failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (info: EventClickArg) => {
    onMatchClick?.(info.event.extendedProps.fullMatch);
  };

  return (
    <div className="relative rounded-xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-4">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400">
          Loading matches...
        </div>
      )}

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        dateClick={(arg) => onDateClick?.(arg.dateStr)}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        height="auto"
        eventDidMount={(info) => {
          info.el.style.backgroundColor =
            info.event.backgroundColor ;
          info.el.style.borderColor =
            info.event.borderColor ;
          info.el.style.color = "#ffffff";
          info.el.style.borderRadius = "6px";
          info.el.style.border = "none";
        }}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
        }}
      />

      <Legend />
    </div>
  );
}

function renderEventContent(info: EventContentArg) {
  return (
    <div className="p-1 overflow-hidden cursor-pointer">
      <div className="text-xs font-semibold truncate text-white">
        {info.event.title}
      </div>
      <div className="text-[10px] uppercase opacity-90 text-white">
        {info.event.extendedProps.format}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap gap-4 text-sm">
      {Object.entries(statusColors).map(([key, color]) => (
        <div key={key} className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded"
            style={{ backgroundColor: color.bg }}
          />
          <span className="capitalize text-gray-600 dark:text-gray-400">
            {key.replace("_", " ")}
          </span>
        </div>
      ))}
    </div>
  );
}
