# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager
Use `pnpm` for all Node.js/TypeScript operations.

## Development Commands
- `pnpm install` - Install dependencies
- `pnpm run dev` - Start development server (Vite dev server)
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build locally


## Project Architecture

### Core Purpose
A React-based schedule beautifier that transforms tab-separated schedule data into an interactive weekly calendar view with PDF export capabilities.

### Key Components Structure
- **App.tsx**: Main application component handling data parsing, state management, and week navigation
- **components/Schedule.tsx**: Calendar grid component with event rendering, modal editing, and overlap handling
- **types.ts**: Core data types (ScheduleEvent interface)

### Data Flow
1. User inputs tab-separated schedule data (8 columns: start time, end time, title, description, capacity, total, waiting, price)
2. App.tsx parses data into ScheduleEvent objects and assigns colors
3. Schedule component renders events in a time-grid layout (6 AM - 11 PM)
4. Events can be edited via modal or created by clicking empty time slots

### Key Features
- Week-by-week navigation
- Interactive event editing modal
- Event color assignment by title
- Overlapping event handling with column layout
- PDF export using html2canvas + jsPDF (loaded externally)
- Toggle options for date numbers and booking counts

### File Organization
```
├── App.tsx                 # Main app with parsing logic and state
├── components/
│   └── Schedule.tsx       # Calendar grid and event modal
├── types.ts              # ScheduleEvent interface
├── index.tsx             # React entry point
└── index.html            # HTML with external PDF libraries
```

### External Dependencies
- PDF export relies on html2canvas and jsPDF loaded from CDN in index.html
- Uses Tailwind CSS for styling (configured in Vite setup)

### Data Format
Input expects tab-separated values with header row:
```
Hora de inicio    Hora de finalización    Título    Descripción    Capacidad    Total    Esperando    Precio
8/9/2025 8:30     8/9/2025 9:30          ...       ...            10           1        0            1
```

Date format: D/M/YYYY H:mm (Spanish format with 24-hour time)