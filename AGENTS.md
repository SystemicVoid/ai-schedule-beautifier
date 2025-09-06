# Repository Guidelines

## Project Structure & Module Organization
- Source entry: `index.tsx` (mounts `App.tsx`).
- UI components: `components/` (e.g., `components/Schedule.tsx`).
- Shared types: `types.ts`.
- Static shell: `index.html` (Tailwind via CDN for styles).
- Build output: `dist/` (do not edit, git-ignored).
- Config: `vite.config.ts`, `tsconfig.json`, `biome.json`, `.htmlvalidate.json`.
- Secrets: `.env.local` for `GEMINI_API_KEY` (ignored by git).

## Build, Test, and Development Commands
- Dev server: `npm run dev` — starts Vite locally.
- Build: `npm run build` — outputs production assets to `dist/`.
- Preview: `npm run preview` — serves the built app.
- Type check: `npm run typecheck` — runs `tsc --noEmit`.
- Lint: `npm run lint` / Fix: `npm run lint:fix` — Biome lints code.
- Format: `npm run format` / Write: `npm run format:write` — Biome formats code.
- HTML validation: `npm run validate:html` — validates `index.html`.
- Quality bundle: `npm run quality` — runs typecheck + checks + HTML validate. If using npm, run the sub-commands manually: `npm run typecheck && npm run check && npm run validate:html`.

## Coding Style & Naming Conventions
- Indentation: 2 spaces; line width 100; double quotes; semicolons; trailing commas (ES5). Enforced by Biome (`biome.json`).
- React: functional components in `.tsx`; Component files PascalCase (e.g., `Schedule.tsx`).
- Naming: variables `camelCase`, types/interfaces `PascalCase`, constants `UPPER_SNAKE_CASE`.
- Imports: ESM modules; path alias `@/` points to repo root.

## Testing Guidelines
- No unit test framework is configured yet. Prefer incremental PRs and manual checks:
  - Run `npm run typecheck`, `npm run check`, and `npm run validate:html`.
  - Verify CSV/TSV parsing with a small sample and confirm the weekly grid renders as expected.
  - Consider adding Vitest + React Testing Library for future tests (`tests/` with `*.test.tsx`).

## Commit & Pull Request Guidelines
- Commits: imperative, concise subject; optional scope. Examples: `Add CSV file upload`, `Hide empty weekend columns`, `Remove PDF export for print-only`.
- PRs: clear description, linked issue, reproduction steps, and before/after screenshots of the schedule view using a sample file. Note any UX/accessibility or print changes.

## Security & Configuration Tips
- Never commit secrets. Keep `GEMINI_API_KEY` only in `.env.local`.
- The build injects `process.env.GEMINI_API_KEY` via Vite defines; avoid logging keys or sending them to clients unnecessarily.
