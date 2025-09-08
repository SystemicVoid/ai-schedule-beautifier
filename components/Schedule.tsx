import type React from "react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { ScheduleEvent } from "../types";

const HOUR_HEIGHT = 60; // pixels per hour for visible sections
// Default bounds (used only as fallback when no events are present)
const CALENDAR_START_HOUR = 6;
const CALENDAR_END_HOUR = 23;
// Gap collapse configuration
const GAP_MARKER_HEIGHT = 16; // pixels height for the collapsed gap marker
const MIN_COLLAPSIBLE_GAP_MINUTES = 60; // collapse only gaps >= 60 minutes
const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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

  // Minutes of day helper
  const minutesOfDay = useCallback((date: Date) => date.getHours() * 60 + date.getMinutes(), []);

  // Compute global visible window (crop fully empty top/bottom hours across the entire week)
  const { visibleStartMin, visibleEndMin } = useMemo(() => {
    if (events.length === 0) {
      return {
        visibleStartMin: CALENDAR_START_HOUR * 60,
        visibleEndMin: CALENDAR_END_HOUR * 60,
      };
    }

    let minStart = Infinity;
    let maxEnd = -Infinity;
    for (const e of events) {
      const s = minutesOfDay(e.start);
      const en = minutesOfDay(e.end);
      if (s < minStart) minStart = s;
      if (en > maxEnd) maxEnd = en;
    }
    // Round to hour for tidy grid
    minStart = Math.max(0, Math.floor(minStart / 60) * 60);
    maxEnd = Math.min(24 * 60, Math.ceil(maxEnd / 60) * 60);
    return { visibleStartMin: minStart, visibleEndMin: maxEnd };
  }, [events, minutesOfDay]);

  // Build union of time intervals where at least one event exists across any day
  const unionIntervals = useMemo(() => {
    const intervals: Array<{ start: number; end: number }> = [];
    for (const e of events) {
      const start = Math.max(visibleStartMin, minutesOfDay(e.start));
      const end = Math.min(visibleEndMin, minutesOfDay(e.end));
      if (end > start) intervals.push({ start, end });
    }
    intervals.sort((a, b) => a.start - b.start);
    // Merge
    const merged: Array<{ start: number; end: number }> = [];
    for (const iv of intervals) {
      if (merged.length === 0 || iv.start > merged[merged.length - 1].end) {
        merged.push({ ...iv });
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, iv.end);
      }
    }
    return merged;
  }, [events, visibleStartMin, visibleEndMin, minutesOfDay]);

  // Create vertical timeline segments: visible stretches and collapsed gaps
  type Segment = { type: "visible" | "gap"; start: number; end: number; height: number };
  const segments = useMemo<Segment[]>(() => {
    const segs: Segment[] = [];
    if (visibleEndMin <= visibleStartMin) return segs;

    if (unionIntervals.length === 0) {
      // No events within window – show a single visible block (fallback)
      segs.push({
        type: "visible",
        start: visibleStartMin,
        end: visibleEndMin,
        height: ((visibleEndMin - visibleStartMin) / 60) * HOUR_HEIGHT,
      });
      return segs;
    }

    // Build gaps between merged intervals, ignoring outer gaps (they are cropped already)
    const intervals: Array<{ start: number; end: number }> = unionIntervals.slice();
    // Visible segment before first interval is already cropped out
    for (let i = 0; i < intervals.length; i++) {
      const cur = intervals[i];
      // Add visible segment for current interval
      segs.push({
        type: "visible",
        start: cur.start,
        end: cur.end,
        height: ((cur.end - cur.start) / 60) * HOUR_HEIGHT,
      });

      const next = intervals[i + 1];
      if (!next) break;
      const gapStart = cur.end;
      const gapEnd = next.start;
      const gapMinutes = gapEnd - gapStart;
      if (gapMinutes > 0) {
        if (gapMinutes >= MIN_COLLAPSIBLE_GAP_MINUTES) {
          segs.push({ type: "gap", start: gapStart, end: gapEnd, height: GAP_MARKER_HEIGHT });
        } else {
          // Small gap – keep as visible space to avoid excessive markers
          segs.push({
            type: "visible",
            start: gapStart,
            end: gapEnd,
            height: (gapMinutes / 60) * HOUR_HEIGHT,
          });
        }
      }
    }
    return segs;
  }, [unionIntervals, visibleStartMin, visibleEndMin]);

  const totalHeight = useMemo(() => segments.reduce((acc, s) => acc + s.height, 0), [segments]);

  // Map absolute minutes-of-day to Y position considering collapsed gaps
  const mapMinToY = useCallback(
    (absMin: number) => {
      // Clamp into cropped window
      const clamped = Math.max(visibleStartMin, Math.min(absMin, visibleEndMin));
      let y = 0;
      for (const seg of segments) {
        if (clamped < seg.start) break;
        if (clamped >= seg.end) {
          y += seg.height;
        } else {
          if (seg.type === "visible") {
            y += ((clamped - seg.start) / 60) * HOUR_HEIGHT;
          } else {
            // Inside a collapsed gap: place at the gap start position
            // (this situation should not occur for events since gaps have no events)
            y += 0;
          }
          break;
        }
      }
      return y;
    },
    [segments, visibleStartMin, visibleEndMin]
  );

  const getEventPosition = useCallback(
    (event: ScheduleEvent) => {
      const startMin = minutesOfDay(event.start);
      const endMin = minutesOfDay(event.end);
      const top = mapMinToY(startMin);
      const mappedEnd = mapMinToY(endMin);
      const height = Math.max(mappedEnd - top, 20); // enforce a minimum height

      let dayIndex = event.start.getDay() - 1;
      if (dayIndex === -1) dayIndex = 6;

      return { top, height, dayIndex };
    },
    [mapMinToY, minutesOfDay]
  );

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

  // Determine which weekend days to show: hide empty Saturday/Sunday
  const visibleDayIndices = useMemo(() => {
    const indices = [0, 1, 2, 3, 4]; // Always show Mon-Fri
    if ((eventsByDay[5] || []).length > 0) indices.push(5); // Saturday if has events
    if ((eventsByDay[6] || []).length > 0) indices.push(6); // Sunday if has events
    return indices;
  }, [eventsByDay]);

  // Creation/editing interactions disabled for print-only display
  const handleSlotClick = (_day: Date, _hour: number) => {};

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
      <div
        className="grid sticky top-0 bg-white z-10 border-b border-l border-slate-200"
        style={{ gridTemplateColumns: `repeat(${visibleDayIndices.length}, minmax(0, 1fr))` }}
      >
        {visibleDayIndices.map((dayIdx) => (
          <div
            key={days[dayIdx].toISOString()}
            className="flex-1 text-center py-2 border-r border-slate-200"
          >
            <span className="font-semibold text-slate-700">{daysOfWeek[dayIdx]}</span>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex flex-grow overflow-auto">
        <div
          className="grid flex-grow relative border-l border-slate-200"
          style={{
            gridTemplateColumns: `repeat(${visibleDayIndices.length}, minmax(0, 1fr))`,
            height: `${totalHeight}px`,
          }}
        >
          {/* Grid background: visible sections with hour lines + collapsed gap markers */}
          <div className="absolute inset-0 flex flex-col">
            {segments.map((seg, idx) => {
              if (seg.type === "gap") {
                return (
                  <div key={`gap-${idx}`} style={{ height: `${seg.height}px` }} className="flex items-center">
                    <div className="w-full border-t border-dashed border-slate-300 relative">
                      <span className="absolute left-1/2 -translate-x-1/2 -top-2 text-slate-400 text-xs tracking-widest">
                        • • •
                      </span>
                    </div>
                  </div>
                );
              }

              // Visible time segment: draw hour separators within this segment
              const rows = [] as any[];
              let p = seg.start;
              while (p < seg.end) {
                const nextBoundary = Math.min(seg.end, Math.floor(p / 60) * 60 + 60);
                const blockMin = Math.max(0, nextBoundary - p);
                const h = (blockMin / 60) * HOUR_HEIGHT;
                rows.push(
                  <div key={`row-${idx}-${p}`} style={{ height: `${h}px` }} className="border-b border-slate-200" />
                );
                p = nextBoundary;
              }

              return (
                <div key={`vis-${idx}`} style={{ height: `${seg.height}px` }} className="flex flex-col">
                  {rows.length === 0 ? (
                    <div className="border-b border-slate-200" style={{ height: `${seg.height}px` }} />
                  ) : (
                    rows
                  )}
                </div>
              );
            })}
          </div>

          {/* Day columns */}
          {visibleDayIndices.map((dayIndex) => (
            <div
              key={days[dayIndex].toISOString()}
              className="relative border-r border-slate-200"
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
                    style={{ top: `${top}px`, height: `${height}px`, width, left }}
                    className={`absolute p-2 rounded-lg border text-xs overflow-hidden ${event.color}`}
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
