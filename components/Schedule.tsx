import type React from "react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { ScheduleEvent } from "../types";

const HOUR_HEIGHT = 60; // pixels per hour
const CALENDAR_START_HOUR = 6;
const CALENDAR_END_HOUR = 23;
const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// --- Helper Functions ---

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
};

// YYYY-MM-DDTHH:mm format for datetime-local input
const formatDateTimeLocal = (date: Date): string => {
  const pad = (num: number) => num.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// --- EventModal Component ---

interface EventModalProps {
  eventData: ScheduleEvent | Partial<ScheduleEvent> | null;
  onClose: () => void;
  onSave: (event: ScheduleEvent) => void;
  onDelete: (eventId: string) => void;
}

const EventModal: React.FC<EventModalProps> = ({ eventData, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<ScheduleEvent | Partial<ScheduleEvent> | null>(null);
  const titleId = useId();
  const startId = useId();
  const endId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setFormData(eventData);
  }, [eventData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: new Date(value) } : null));
  };

  // No booking numeric fields are shown/edited.

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      // Basic validation
      if (!formData.title || !formData.start || !formData.end) {
        alert("Title, start time, and end time are required.");
        return;
      }
      if (formData.start >= formData.end) {
        alert("End time must be after start time.");
        return;
      }
      onSave(formData as ScheduleEvent);
    }
  };

  const handleDelete = () => {
    if (
      formData &&
      "id" in formData &&
      formData.id &&
      window.confirm("Are you sure you want to delete this event?")
    ) {
      onDelete(formData.id);
    }
  };

  if (!formData) return null;

  const isNewEvent = !("id" in formData && formData.id);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <form onSubmit={handleSave}>
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-slate-800">
              {isNewEvent ? "Create New Event" : "Edit Event"}
            </h3>
          </div>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label htmlFor={titleId} className="block text-sm font-medium text-slate-600 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                id={titleId}
                value={formData.title || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={startId} className="block text-sm font-medium text-slate-600 mb-1">
                  Start
                </label>
                <input
                  type="datetime-local"
                  name="start"
                  id={startId}
                  value={formData.start ? formatDateTimeLocal(formData.start) : ""}
                  onChange={handleDateChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div>
                <label htmlFor={endId} className="block text-sm font-medium text-slate-600 mb-1">
                  End
                </label>
                <input
                  type="datetime-local"
                  name="end"
                  id={endId}
                  value={formData.end ? formatDateTimeLocal(formData.end) : ""}
                  onChange={handleDateChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor={descriptionId}
                className="block text-sm font-medium text-slate-600 mb-1"
              >
                Description
              </label>
              <textarea
                name="description"
                id={descriptionId}
                value={formData.description || ""}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500"
              ></textarea>
            </div>
            {/* Booking-related fields removed for print-only use */}
          </div>
          <div className="p-4 bg-slate-50 rounded-b-lg flex justify-between items-center">
            <div>
              {!isNewEvent && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Delete Event
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-white text-slate-700 font-semibold py-2 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-violet-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-violet-700 transition-all duration-200 shadow-sm"
              >
                {isNewEvent ? "Create Event" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Schedule Component ---

interface ScheduleProps {
  events: ScheduleEvent[];
  weekStart: Date;
  onEventUpdate: (updatedEvent: ScheduleEvent) => void;
  onEventDelete: (eventId: string) => void;
  onEventCreate: (newEvent: ScheduleEvent) => void;
}

export const Schedule: React.FC<ScheduleProps> = ({
  events,
  weekStart,
  onEventUpdate,
  onEventDelete,
  onEventCreate,
}) => {
  const [modalEvent, setModalEvent] = useState<ScheduleEvent | Partial<ScheduleEvent> | null>(null);

  const days = useMemo(() => {
    const d = new Date(weekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(d);
      day.setDate(d.getDate() + i);
      return day;
    });
  }, [weekStart]);

  const hours = useMemo(() => {
    return Array.from(
      { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 },
      (_, i) => CALENDAR_START_HOUR + i
    );
  }, []);

  const getEventPosition = useCallback((event: ScheduleEvent) => {
    const startOfDay = new Date(event.start);
    startOfDay.setHours(CALENDAR_START_HOUR, 0, 0, 0);

    const minutesFromCalendarStart = (event.start.getTime() - startOfDay.getTime()) / (1000 * 60);
    const top = (minutesFromCalendarStart / 60) * HOUR_HEIGHT;

    const durationMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
    const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20); // min height

    let dayIndex = event.start.getDay() - 1;
    if (dayIndex === -1) dayIndex = 6;

    return { top, height, dayIndex };
  }, []);

  const eventsByDay = useMemo(() => {
    const grouped: { [key: number]: ScheduleEvent[] } = {};
    for (let i = 0; i < 7; i++) grouped[i] = [];

    events.forEach((event) => {
      const { dayIndex } = getEventPosition(event);
      if (grouped[dayIndex]) {
        grouped[dayIndex].push(event);
      }
    });

    // Simple overlap handling: sort by start time and assign horizontal positions
    Object.values(grouped).forEach((dayEvents) => {
      dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
      const columns: ScheduleEvent[][] = [];
      dayEvents.forEach((event) => {
        let placed = false;
        for (const col of columns) {
          if (col[col.length - 1].end.getTime() <= event.start.getTime()) {
            col.push(event);
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push([event]);
        }
      });

      const totalCols = columns.length;
      columns.forEach((col, colIndex) => {
        col.forEach((event) => {
          event.colIndex = colIndex;
          event.totalCols = totalCols;
        });
      });
    });

    return grouped;
  }, [events, getEventPosition]);

  const handleSlotClick = (day: Date, hour: number) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(day);
    end.setHours(hour + 1, 0, 0, 0);

    setModalEvent({
      start,
      end,
      title: "",
      description: "",
      capacity: 10,
      total: 0,
      waiting: 0,
      price: 0,
    });
  };

  const handleModalClose = () => {
    setModalEvent(null);
  };

  const handleModalSave = (eventToSave: ScheduleEvent) => {
    if ("id" in eventToSave && eventToSave.id && !eventToSave.id.startsWith("new-")) {
      onEventUpdate(eventToSave);
    } else {
      onEventCreate({ ...eventToSave, id: `new-${Date.now()}` });
    }
    handleModalClose();
  };

  const handleModalDelete = (eventId: string) => {
    onEventDelete(eventId);
    handleModalClose();
  };

  return (
    <div className="flex flex-col select-none">
      {/* Header */}
      <div className="grid grid-cols-[4rem_repeat(7,1fr)] sticky top-0 bg-white z-10 border-b border-l border-slate-200">
        <div className="w-16 border-r border-slate-200"></div>
        {days.map((day, i) => (
          <div
            key={day.toISOString()}
            className="flex-1 text-center py-2 border-r border-slate-200"
          >
            <span className="font-semibold text-slate-700">{daysOfWeek[i]}</span>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex flex-grow overflow-auto">
        <div className="w-16 flex-shrink-0">
          {hours.map((hour) => (
            <div
              key={hour}
              style={{ height: `${HOUR_HEIGHT}px` }}
              className="relative text-right pr-2"
            >
              <span className="text-xs text-slate-400 absolute -top-2 right-2">{hour}:00</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-grow relative border-l border-slate-200">
          {/* Grid lines */}
          <div className="col-span-7 grid grid-cols-1 absolute inset-0">
            {hours.map((hour) => (
              <div
                key={hour}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="border-b border-slate-200"
              ></div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIndex) => (
            <div
              key={day.toISOString()}
              className="relative border-r border-slate-200"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const hour = Math.floor(y / HOUR_HEIGHT) + CALENDAR_START_HOUR;
                  handleSlotClick(day, hour);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSlotClick(day, CALENDAR_START_HOUR);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Create event on ${day.toLocaleDateString()}`}
            >
              {/* Events for this day */}
              {(eventsByDay[dayIndex] || []).map((event) => {
                const { top, height } = getEventPosition(event);
                const colIndex = event.colIndex || 0;
                const totalCols = event.totalCols || 1;
                const width = `${100 / totalCols}%`;
                const left = `${colIndex * (100 / totalCols)}%`;

                return (
                  <div
                    key={event.id}
                    onClick={() => setModalEvent(event)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setModalEvent(event);
                      }
                    }}
                    style={{ top: `${top}px`, height: `${height}px`, width, left }}
                    className={`absolute p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg hover:border-opacity-100 overflow-hidden ${event.color}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Edit event: ${event.title} from ${formatTime(event.start)} to ${formatTime(event.end)}`}
                  >
                    <p className="font-bold truncate">{event.title}</p>
                    <p className="text-opacity-80">
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {modalEvent && (
        <EventModal
          eventData={modalEvent}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onDelete={handleModalDelete}
        />
      )}
    </div>
  );
};
