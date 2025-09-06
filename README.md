**AI Schedule Beautifier**

Tiny React + Vite app to import CSV/TSV class schedules, auto-beautify them, and render a clean weekly grid. Tailwind is loaded via CDN in `index.html`.

Production is deployed on Vercel. Pushes to `main` trigger automatic redeploys.

## Quick Start
- Prerequisites: Node.js 18+
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build` (outputs to `dist/`)
- Preview build: `npm run preview`

## Quality Checks
- Type check: `npm run typecheck`
- Lint: `npm run lint` (fix: `npm run lint:fix`)
- Format: `npm run format` (write: `npm run format:write`)
- HTML validate: `npm run validate:html`

## Configuration
- Env: create `.env.local` with `GEMINI_API_KEY=<your_key>` (not committed).
- Aliases: `@/` points to repo root.

## Deploy (Vercel + GitHub)
- GitHub: repository is public; `main` is protected (PRs required).
- Vercel: connected to the GitHub repo with auto-deploys from `main`.
- First-time setup: add `GEMINI_API_KEY` in Vercel Project Settings → Environment Variables (Production + Preview as needed).

## Project Layout
- Entry: `index.tsx` mounts `App.tsx`
- Components: `components/`
- Types: `types.ts`
- Static shell: `index.html`
- Build output: `dist/` (git-ignored)

No personal or machine-specific information is committed to this repository.
