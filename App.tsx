import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { Schedule } from "./components/Schedule";
import type { ScheduleEvent } from "./types";

// Helper function to parse the specific date format 'D/M/YYYY H:mm'
const parseDate = (dateStr: string, timeStr: string): Date | null => {
  const dateParts = dateStr.split("/");
  const timeParts = timeStr.split(":");
  if (dateParts.length === 3 && timeParts.length === 2) {
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(dateParts[2], 10);
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    if (
      !Number.isNaN(day) &&
      !Number.isNaN(month) &&
      !Number.isNaN(year) &&
      !Number.isNaN(hour) &&
      !Number.isNaN(minute)
    ) {
      return new Date(year, month, day, hour, minute);
    }
  }
  return null;
};

const COLORS = [
  "bg-rose-200 border-rose-300",
  "bg-amber-200 border-amber-300",
  "bg-lime-200 border-lime-300",
  "bg-emerald-200 border-emerald-300",
  "bg-cyan-200 border-cyan-300",
  "bg-violet-200 border-violet-300",
  "bg-fuchsia-200 border-fuchsia-300",
  "bg-sky-200 border-sky-300",
];

const TEXT_COLORS = [
  "text-rose-800",
  "text-amber-800",
  "text-lime-800",
  "text-emerald-800",
  "text-cyan-800",
  "text-violet-800",
  "text-fuchsia-800",
  "text-sky-800",
];

const getColor = (title: string, colorMap: Map<string, { bg: string; text: string }>) => {
  if (!colorMap.has(title)) {
    const index = colorMap.size % COLORS.length;
    colorMap.set(title, { bg: COLORS[index], text: TEXT_COLORS[index] });
  }
  const color = colorMap.get(title);
  if (!color) {
    throw new Error(`Color not found for title: ${title}`);
  }
  return color;
};

// CSV parser utility that handles quoted fields properly
const parseCSV = (text: string): string[][] => {
  const result: string[][] = [];
  const lines = text.split("\n");
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    let charIndex = 0;

    while (charIndex < line.length) {
      const char = line[charIndex];

      if (char === '"') {
        if (insideQuotes && line[charIndex + 1] === '"') {
          // Escaped quote
          currentField += '"';
          charIndex += 2;
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
          charIndex++;
        }
      } else if (char === "," && !insideQuotes) {
        // Field separator
        currentRow.push(currentField.trim());
        currentField = "";
        charIndex++;
      } else {
        currentField += char;
        charIndex++;
      }
    }

    if (!insideQuotes) {
      // End of row
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        result.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      // Continue to next line (multi-line field)
      currentField += "\n";
    }

    i++;
  }

  // Handle last row if not completed
  if (currentRow.length > 0 || currentField.length > 0) {
    currentRow.push(currentField.trim());
    result.push(currentRow);
  }

  return result;
};

// Detect if input is CSV or TSV format
const detectFormat = (text: string): "csv" | "tsv" => {
  const firstLine = text.split("\n")[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  return commaCount > tabCount ? "csv" : "tsv";
};

const App: React.FC = () => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [inputData, setInputData] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "file">("text");

  const handleFileSelect = (file: File) => {
    if (
      file.type !== "text/csv" &&
      !file.name.toLowerCase().endsWith(".csv") &&
      !file.name.toLowerCase().endsWith(".tsv")
    ) {
      setError("Please select a CSV or TSV file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setError("File size must be less than 5MB.");
      return;
    }
    setSelectedFile(file);
    setInputMode("file");
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0] as File);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setInputMode("text");
    setError(null);
  };

  const processFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content) {
          reject(new Error("Failed to read file content"));
          return;
        }
        resolve(content);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const handleGenerate = useCallback(async () => {
    setError(null);
    setIsProcessing(true);

    try {
      let rawData = "";

      // Get data based on input mode
      if (inputMode === "file" && selectedFile) {
        rawData = await processFile(selectedFile);
      } else if (inputMode === "text" && inputData.trim()) {
        rawData = inputData.trim();
      } else {
        setError("Please provide schedule data either by uploading a file or pasting text.");
        return;
      }

      // Detect format and parse data
      const format = detectFormat(rawData);
      let parsedRows: string[][];

      if (format === "csv") {
        parsedRows = parseCSV(rawData);
      } else {
        // TSV format - split by tabs
        parsedRows = rawData
          .split("\n")
          .map((line) => line.split("\t").map((field) => field.trim()));
      }

      // Remove empty rows and get header + data rows
      parsedRows = parsedRows.filter((row) => row.some((cell) => cell.length > 0));

      if (parsedRows.length < 2) {
        setError("File must contain at least a header row and one data row.");
        return;
      }

      const dataRows = parsedRows.slice(1); // Skip header
      const colorMap = new Map<string, { bg: string; text: string }>();

      const parsedEvents: ScheduleEvent[] = dataRows
        .map((columns, index) => {
          if (columns.length < 8) {
            throw new Error(
              `Row ${index + 2}: Not enough columns. Expected 8, found ${columns.length}.`
            );
          }

          const [startDateStr, startTimeStr] = columns[0].split(/\s+/);
          const [endDateStr, endTimeStr] = columns[1].split(/\s+/);

          const start = parseDate(startDateStr, startTimeStr);
          const end = parseDate(endDateStr, endTimeStr);

          if (!start || !end) {
            throw new Error(
              `Row ${index + 2}: Invalid date/time format in "${columns[0]}" or "${columns[1]}".`
            );
          }

          const title = columns[2];
          const { bg, text } = getColor(title, colorMap);

          return {
            id: `${start.toISOString()}-${title}-${index}`,
            start,
            end,
            title,
            description: columns[3],
            capacity: parseInt(columns[4], 10) || 0,
            total: parseInt(columns[5], 10) || 0,
            waiting: parseInt(columns[6], 10) || 0,
            price: parseFloat(columns[7]) || 0,
            color: `${bg} ${text}`,
          };
        })
        .filter((e) => e.start && e.end);

      setEvents(parsedEvents);

      if (parsedEvents.length > 0) {
        const firstEventDate = parsedEvents.sort((a, b) => a.start.getTime() - b.start.getTime())[0]
          .start;
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
        setError("An unknown error occurred during parsing.");
      }
      setEvents([]);
      setCurrentWeekStart(null);
    } finally {
      setIsProcessing(false);
    }
  }, [inputData, inputMode, selectedFile, processFile]);

  const updateEvent = (updatedEvent: ScheduleEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
  };

  const deleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const createNewEvent = (newEvent: ScheduleEvent) => {
    const colorMap = new Map<string, { bg: string; text: string }>();
    for (const event of events) {
      getColor(event.title, colorMap);
    }
    const { bg, text } = getColor(newEvent.title, colorMap);

    setEvents((prev) => [...prev, { ...newEvent, color: `${bg} ${text}` }]);
  };

  // Declare types for external PDF libraries
  interface Html2CanvasWindow extends Window {
    html2canvas?: (element: HTMLElement, options?: unknown) => Promise<HTMLCanvasElement>;
    jspdf?: {
      jsPDF: new (
        options?: unknown
      ) => {
        internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
        addImage: (
          imgData: string,
          format: string,
          x: number,
          y: number,
          width: number,
          height: number
        ) => void;
        save: (filename: string) => void;
      };
    };
  }

  const handleExportToPDF = () => {
    const scheduleElement = document.getElementById("schedule-to-print");
    const htmlWindow = window as Html2CanvasWindow;

    if (scheduleElement && htmlWindow.html2canvas && htmlWindow.jspdf) {
      const { jsPDF } = htmlWindow.jspdf;
      htmlWindow
        .html2canvas(scheduleElement, { scale: 2, logging: false })
        .then((canvas: HTMLCanvasElement) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF({
            orientation: "landscape",
            unit: "px",
            hotfixes: ["px_scaling"],
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

          pdf.addImage(imgData, "PNG", x, y, pdfW, pdfH);
          pdf.save("schedule.pdf");
        });
    } else {
      alert(
        "PDF generation library could not be loaded. Please check your connection and try again."
      );
    }
  };

  // Week navigation removed for print-only use

  const currentWeekEvents = useMemo(() => {
    if (!currentWeekStart) return [];
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return events.filter((event) => event.start >= currentWeekStart && event.start < weekEnd);
  }, [events, currentWeekStart]);

  // Week range label removed for print-only use

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-slate-900">Schedule Beautifier</h1>
            <p className="text-slate-500 mt-2">
              Upload a CSV/TSV file or paste your schedule data to generate a beautiful calendar
              view.
            </p>
          </div>

          {/* Input Mode Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setInputMode("file")}
                className={`px-4 py-2 rounded-md transition-all ${
                  inputMode === "file"
                    ? "bg-white shadow-sm text-violet-700 font-semibold"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setInputMode("text")}
                className={`px-4 py-2 rounded-md transition-all ${
                  inputMode === "text"
                    ? "bg-white shadow-sm text-violet-700 font-semibold"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Paste Data
              </button>
            </div>
          </div>

          {/* File Upload Section */}
          {inputMode === "file" && (
            <div className="mb-6">
              {!selectedFile ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    isDragging
                      ? "border-violet-400 bg-violet-50"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      document.getElementById("file-input")?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Drag and drop CSV file here or press Enter to choose file"
                >
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-slate-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <title>Upload file icon</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-lg font-medium text-slate-700 mb-2">
                      Drag & drop your CSV file here
                    </p>
                    <p className="text-slate-500 mb-4">or</p>
                    <label className="cursor-pointer bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors">
                      Choose File
                      <input
                        id="file-input"
                        type="file"
                        accept=".csv,.tsv"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-slate-400 mt-2">CSV or TSV files up to 5MB</p>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-300 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg
                        className="w-8 h-8 text-green-500 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="font-medium text-slate-700">{selectedFile.name}</p>
                        <p className="text-sm text-slate-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearFile}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text Input Section */}
          {inputMode === "text" && (
            <div className="mb-6">
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="w-full h-64 p-4 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow duration-200"
                placeholder={`Hora de inicio,Hora de finalización,Título,Descripción,Capacidad,Total,Esperando,Precio
8/9/2025 8:30,8/9/2025 9:30,Stretching (Spagat),...,10,1,0,1.00`}
              />
            </div>
          )}

          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={
              isProcessing ||
              (inputMode === "file" && !selectedFile) ||
              (inputMode === "text" && !inputData.trim())
            }
            className="w-full bg-violet-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-violet-700 active:bg-violet-800 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Generate Schedule"}
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
        </div>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex justify-center sm:justify-end items-center gap-2">
            <button
              onClick={() => {
                setEvents([]);
                setInputData("");
                setCurrentWeekStart(null);
              }}
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

      <div
        id="schedule-to-print"
        className="bg-white p-4 rounded-lg shadow-md border border-slate-200"
      >
        {currentWeekStart && (
          <Schedule
            events={currentWeekEvents}
            weekStart={currentWeekStart}
            onEventUpdate={updateEvent}
            onEventDelete={deleteEvent}
            onEventCreate={createNewEvent}
          />
        )}
      </div>
    </div>
  );
};

export default App;
