import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageMeta from "../components/common/PageMeta";
import { fetchMatches, ApiMatch } from "../api/matches";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    isMatch?: boolean;
    matchData?: ApiMatch;
  };
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const navigate = useNavigate();

  const calendarsEvents = {
    Danger: "danger",
    Success: "success",
    Primary: "primary",
    Warning: "warning",
  };

  const matchStatusColors: Record<string, string> = {
    not_started: "warning",
    started: "success",
    completed: "primary",
    abandoned: "danger",
    cancelled: "danger",
  };

  useEffect(() => {
    loadCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCalendarData = async () => {
    setLoadingMatches(true);
    try {
      // Load custom events
      const customEvents: CalendarEvent[] = [
        {
          id: "1",
          title: "Event Conf.",
          start: new Date().toISOString(),
          allDay: true,
          extendedProps: { calendar: "danger" },
        },
        {
          id: "2",
          title: "Meeting",
          start: new Date(Date.now() + 86400000).toISOString(),
          allDay: true,
          extendedProps: { calendar: "success" },
        },
        {
          id: "3",
          title: "Workshop",
          start: new Date(Date.now() + 172800000).toISOString(),
          end: new Date(Date.now() + 259200000).toISOString(),
          allDay: true,
          extendedProps: { calendar: "primary" },
        },
      ];

      // Load matches
      const matchesResponse = await fetchMatches({
        sport: "cricket",
        limit: 1000,
        status: "all",
      });


      const matchEvents: CalendarEvent[] = matchesResponse.items
        .filter((match) => match.startedAt || match.expectedStartedAt)
        .map((match) => {
          const startTime =
            (match.startedAt || match.expectedStartedAt || 0) * 1000;
          const endTime = match.endedAt
            ? match.endedAt * 1000
            : startTime + 3 * 60 * 60 * 1000;


          const status = match.status || "not_started";
          const calendar = matchStatusColors[status] || "warning";

          return {
            id: `match-${match.id}`,
            title: `🏏 ${match.shortName || match.name}`,
            start: new Date(startTime).toISOString(),
            end: new Date(endTime).toISOString(),
            extendedProps: {
              calendar,
              isMatch: true,
              matchData: match,
            },
          };
        });

      console.log("Match events:", matchEvents);
      const allEvents = [...customEvents, ...matchEvents];
      console.log("All events:", allEvents);
      setEvents(allEvents);
    } catch (error) {
      console.error("Failed to load calendar data:", error);
      // Still show custom events if match loading fails
      const fallbackEvents = [
        {
          id: "1",
          title: "Event Conf.",
          start: new Date().toISOString(),
          allDay: true,
          extendedProps: { calendar: "danger" },
        },
        {
          id: "2",
          title: "Meeting",
          start: new Date(Date.now() + 86400000).toISOString(),
          allDay: true,
          extendedProps: { calendar: "success" },
        },
        {
          id: "3",
          title: "Workshop",
          start: new Date(Date.now() + 172800000).toISOString(),
          end: new Date(Date.now() + 259200000).toISOString(),
          allDay: true,
          extendedProps: { calendar: "primary" },
        },
      ];
      console.log("Using fallback events:", fallbackEvents);
      setEvents(fallbackEvents);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;

    // If it's a match event, navigate to match details
    if (event.extendedProps.isMatch && event.extendedProps.matchData) {
      const match = event.extendedProps.matchData as ApiMatch;
      navigate(`/contest/${match.id}`);
      return;
    }

    // Otherwise, open edit modal for custom events
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventStartDate(event.start?.toISOString().split("T")[0] || "");
    setEventEndDate(event.end?.toISOString().split("T")[0] || "");
    setEventLevel(event.extendedProps.calendar);
    openModal();
  };

  const handleAddOrUpdateEvent = () => {
    if (selectedEvent) {
      // Update existing event
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
              ...event,
              title: eventTitle,
              start: eventStartDate,
              end: eventEndDate,
              extendedProps: { calendar: eventLevel },
            }
            : event
        )
      );
    } else {
      // Add new event
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: eventTitle,
        start: eventStartDate,
        end: eventEndDate,
        allDay: true,
        extendedProps: { calendar: eventLevel },
      };
      setEvents((prevEvents) => [...prevEvents, newEvent]);
    }
    closeModal();
    resetModalFields();
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
    setSelectedEvent(null);
  };

  return (
    <>
      <PageMeta
        title="React.js Calendar Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Calendar Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="rounded-2xl border  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {loadingMatches && (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading matches...
          </div>
        )}
        {!loadingMatches && events.length > 0 && (
          <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {events.length} events on calendar
          </div>
        )}
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            themeSystem="bootstrap5"
            events={events}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            eventDisplay="block"
            customButtons={{
              addEventButton: {
                text: "Add Event +",
                click: openModal,
              },
            }}
          />
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Legend
          </h3>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-600 dark:text-gray-400">
                🏏 Match - Not Started
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">
                🏏 Match - Live
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600 dark:text-gray-400">
                🏏 Match - Completed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600 dark:text-gray-400">
                🏏 Match - Cancelled/Abandoned
              </span>
            </div>
          </div>
        </div>

        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[700px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Edit Event" : "Add Event"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Plan your next big moment: schedule or edit an event to stay on
                track
              </p>
            </div>
            <div className="mt-8">
              <div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Event Title
                  </label>
                  <input
                    id="event-title"
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Color
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {Object.entries(calendarsEvents).map(([key, value]) => (
                    <div key={key} className="n-chk">
                      <div
                        className={`form-check form-check-${value} form-check-inline`}
                      >
                        <label
                          className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
                          htmlFor={`modal${key}`}
                        >
                          <span className="relative">
                            <input
                              className="sr-only form-check-input"
                              type="radio"
                              name="event-level"
                              value={key}
                              id={`modal${key}`}
                              checked={eventLevel === key}
                              onChange={() => setEventLevel(key)}
                            />
                            <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                              <span
                                className={`h-2 w-2 rounded-full bg-white ${eventLevel === key ? "block" : "hidden"
                                  }`}
                              ></span>
                            </span>
                          </span>
                          {key}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter Start Date
                </label>
                <div className="relative">
                  <input
                    id="event-start-date"
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter End Date
                </label>
                <div className="relative">
                  <input
                    id="event-end-date"
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Close
              </button>
              <button
                onClick={handleAddOrUpdateEvent}
                type="button"
                className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              >
                {selectedEvent ? "Update Changes" : "Add Event"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: {
  event: {
    title: string;
    extendedProps: { calendar?: string; isMatch?: boolean };
  };
  timeText?: string;
}) => {
  const isMatch = eventInfo.event.extendedProps.isMatch;
  const calendar = eventInfo.event.extendedProps.calendar?.toLowerCase() || 'primary';

  // Map calendar types to Tailwind classes
  const colorClasses: Record<string, {
    bg: string;
    border: string;
    text: string;
  }> = {
    success: {
      bg: 'bg-green-600 dark:bg-green-500/20',
      border: 'border-l-green-700 dark:border-l-green-500',
      text: 'text-white dark:text-green-300'
    },
    danger: {
      bg: 'bg-red-600 dark:bg-red-500/20',
      border: 'border-l-red-700 dark:border-l-red-500',
      text: 'text-white dark:text-red-300'
    },
    primary: {
      bg: 'bg-blue-600 dark:bg-blue-500/20',
      border: 'border-l-blue-700 dark:border-l-blue-500',
      text: 'text-white dark:text-blue-300'
    },
    warning: {
      bg: 'bg-amber-600 dark:bg-amber-500/20',
      border: 'border-l-amber-700 dark:border-l-amber-500',
      text: 'text-white dark:text-amber-300'
    },
  };

  const colors = colorClasses[calendar] || colorClasses.primary;

  return (
    <div
      className={`flex items-center px-2 py-1.5 rounded cursor-pointer shadow-sm border-l-[3px] ${colors.bg} ${colors.border}`}
      title={isMatch ? "Click to view match details" : "Click to edit event"}
    >
      {eventInfo.timeText && (
        <div className={`text-xs font-semibold mr-2 ${colors.text}`}>
          {eventInfo.timeText}
        </div>
      )}
      <div className={`text-sm font-semibold truncate ${colors.text}`}>
        {eventInfo.event.title}
      </div>
    </div>
  );
};

export default Calendar;