import React, { useState, useCallback, useMemo } from 'react';
import { ScheduleEvent } from './types';
import { Schedule } from './components/Schedule';

// Helper function to parse the specific date format 'D/M/YYYY H:mm'
const parseDate = (dateStr: string, timeStr: string): Date | null => {
  const dateParts = dateStr.split('/');
  const timeParts = timeStr.split(':');
  if (dateParts.length === 3 && timeParts.length === 2) {
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(dateParts[2], 10);
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && !isNaN(hour) && !isNaN(minute)) {
      return new Date(year, month, day, hour, minute);
    }
  }
  return null;
};

const COLORS = [
  'bg-rose-200 border-rose-300', 'bg-amber-200 border-amber-300', 'bg-lime-200 border-lime-300',
  'bg-emerald-200 border-emerald-300', 'bg-cyan-200 border-cyan-300', 'bg-violet-200 border-violet-300',
  'bg-fuchsia-200 border-fuchsia-300', 'bg-sky-200 border-sky-300'
];

const TEXT_COLORS = [
  'text-rose-800', 'text-amber-800', 'text-lime-800', 'text-emerald-800', 'text-cyan-800',
  'text-violet-800', 'text-fuchsia-800', 'text-sky-800'
];

const getColor = (title: string, colorMap: Map<string, { bg: string, text: string }>) => {
  if (!colorMap.has(title)) {
    const index = colorMap.size % COLORS.length;
    colorMap.set(title, { bg: COLORS[index], text: TEXT_COLORS[index] });
  }
  return colorMap.get(title)!;
};


const App: React.FC = () => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [inputData, setInputData] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date | null>(null);
  const [showDateNumbers, setShowDateNumbers] = useState(true);
  const [showBookingCounts, setShowBookingCounts] = useState(true);

  const handleGenerate = useCallback(() => {
    setError(null);
    const lines = inputData.trim().split('\n').slice(1); // Skip header
    if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
      setError('Input data is empty. Please paste your schedule data.');
      return;
    }
    const colorMap = new Map<string, { bg: string, text: string }>();

    try {
      const parsedEvents: ScheduleEvent[] = lines.map((line, index) => {
        const columns = line.split('\t').map(c => c.trim());
        if (columns.length < 8) {
          throw new Error(`Line ${index + 2}: Not enough columns. Expected 8, found ${columns.length}.`);
        }
        
        const [startDateStr, startTimeStr] = columns[0].split(/\s+/);
        const [endDateStr, endTimeStr] = columns[1].split(/\s+/);

        const start = parseDate(startDateStr, startTimeStr);
        const end = parseDate(endDateStr, endTimeStr);

        if (!start || !end) {
          throw new Error(`Line ${index + 2}: Invalid date/time format.`);
        }

        const title = columns[2];
        const { bg, text } = getColor(title, colorMap);

        return {
          id: `${start.toISOString()}-${title}-${index}`,
          start,
          end,
          title,
          description: columns[3],
          capacity: parseInt(columns[4], 10),
          total: parseInt(columns[5], 10),
          waiting: parseInt(columns[6], 10),
          price: parseInt(columns[7], 10),
          color: `${bg} ${text}`,
        };
      }).filter(e => e.start && e.end);

      setEvents(parsedEvents);
      if (parsedEvents.length > 0) {
        const firstEventDate = parsedEvents.sort((a,b) => a.start.getTime() - b.start.getTime())[0].start;
        const weekStart = new Date(firstEventDate);
        // Set to the Monday of that week
        const dayOfWeek = weekStart.getDay(); // Sunday is 0, Monday is 1
        const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(weekStart.getDate() - offset);
        weekStart.setHours(0, 0, 0, 0);
        setCurrentWeekStart(weekStart);
      }

    } catch (e) {
      if (e instanceof Error) {
        setError(`Failed to parse data: ${e.message}`);
      } else {
        setError('An unknown error occurred during parsing.');
      }
      setEvents([]);
      setCurrentWeekStart(null);
    }
  }, [inputData]);

  const updateEvent = (updatedEvent: ScheduleEvent) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };
  
  const deleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };
  
  const createNewEvent = (newEvent: ScheduleEvent) => {
    const colorMap = new Map<string, { bg: string, text: string }>();
    events.forEach(event => getColor(event.title, colorMap));
    const { bg, text } = getColor(newEvent.title, colorMap);
    
    setEvents(prev => [...prev, {...newEvent, color: `${bg} ${text}`}]);
  };

  const handleExportToPDF = () => {
    const scheduleElement = document.getElementById('schedule-to-print');
    if (scheduleElement && (window as any).html2canvas && (window as any).jspdf) {
      const { jsPDF } = (window as any).jspdf;
      (window as any).html2canvas(scheduleElement, { scale: 2, logging: false }).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          hotfixes: ['px_scaling'],
        });
        
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        
        const canvasW = canvas.width;
        const canvasH = canvas.height;
        const ratio = canvasW / canvasH;
        
        let pdfW = pageW - 20; // with margin
        let pdfH = pdfW / ratio;

        if (pdfH > pageH - 20) {
            pdfH = pageH - 20;
            pdfW = pdfH * ratio;
        }
        
        const x = (pageW - pdfW) / 2;
        const y = (pageH - pdfH) / 2;

        pdf.addImage(imgData, 'PNG', x, y, pdfW, pdfH);
        pdf.save('schedule.pdf');
      });
    } else {
      alert("PDF generation library could not be loaded. Please check your connection and try again.");
    }
  };

  const handleWeekChange = (direction: 'next' | 'prev') => {
    if (currentWeekStart) {
      const newWeekStart = new Date(currentWeekStart);
      const offset = direction === 'next' ? 7 : -7;
      newWeekStart.setDate(newWeekStart.getDate() + offset);
      setCurrentWeekStart(newWeekStart);
    }
  };

  const currentWeekEvents = useMemo(() => {
    if (!currentWeekStart) return [];
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return events.filter(event => event.start >= currentWeekStart && event.start < weekEnd);
  }, [events, currentWeekStart]);
  
  const weekRangeString = useMemo(() => {
    if (!currentWeekStart) return '';
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    return `${currentWeekStart.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}, ${currentWeekStart.getFullYear()}`;
  }, [currentWeekStart]);


  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-slate-900">Schedule Beautifier</h1>
            <p className="text-slate-500 mt-2">Paste your tab-separated schedule data below to generate a beautiful calendar view.</p>
          </div>
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            className="w-full h-64 p-4 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow duration-200"
            placeholder={`Hora de inicio\tHora de finalización\tTítulo\tDescripción\tCapacidad\tTotal\tEsperando\tPrecio\n8/9/2025 8:30\t8/9/2025 9:30\tStretching (Spagat)\t...\t10\t1\t0\t1`}
          />
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          <button
            onClick={handleGenerate}
            className="w-full mt-4 bg-violet-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-violet-700 active:bg-violet-800 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
          >
            Generate Schedule
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
        <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-slate-800">Weekly Schedule</h1>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-2">
                <button onClick={() => handleWeekChange('prev')} className="p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Previous week">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </button>
                <h2 className="text-lg font-semibold text-slate-600 whitespace-nowrap">{weekRangeString}</h2>
                <button onClick={() => handleWeekChange('next')} className="p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Next week">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </button>
              </div>
            </div>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex justify-center sm:justify-end items-center gap-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer select-none">
                        <input type="checkbox" checked={showDateNumbers} onChange={() => setShowDateNumbers(s => !s)} className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                        Show Dates
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer select-none">
                        <input type="checkbox" checked={showBookingCounts} onChange={() => setShowBookingCounts(s => !s)} className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                        Show Bookings
                    </label>
                </div>
                <div className="flex justify-center sm:justify-end items-center gap-2">
                  <button
                    onClick={() => { setEvents([]); setInputData(''); setCurrentWeekStart(null); }}
                    className="bg-white text-slate-700 font-semibold py-2 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    New Schedule
                  </button>
                  <button
                    onClick={handleExportToPDF}
                    className="bg-violet-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-violet-700 transition-all duration-200 shadow-sm"
                  >
                    Export to PDF
                  </button>
                </div>
            </div>
        </header>

      <div id="schedule-to-print" className="bg-white p-4 rounded-lg shadow-md border border-slate-200">
        <Schedule 
          events={currentWeekEvents} 
          weekStart={currentWeekStart!}
          onEventUpdate={updateEvent} 
          onEventDelete={deleteEvent}
          onEventCreate={createNewEvent}
          showDateNumbers={showDateNumbers}
          showBookingCounts={showBookingCounts}
        />
      </div>
    </div>
  );
};

export default App;