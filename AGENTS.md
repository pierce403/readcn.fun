# learncn.fun – agent notes

## Stack + commands

- React + TypeScript + Vite, compiled to static `dist/`
- Tailwind CSS v4 via `@tailwindcss/vite` (see `vite.config.ts`)
- Local:
  - `npm install`
  - `npm run dev`
  - `npm run build` (runs `tsc -b` then `vite build`)

## App structure

- `src/App.tsx` is the learncn.fun home screen and app switcher.
- Apps live under `src/apps/*`:
  - `src/apps/read/ReadApp.tsx`
  - `src/apps/write/WriteApp.tsx`
- Each app supports an optional `onHome` callback and renders an “Apps” button in the header when provided.

## Read app

- Shows one Chinese character (`hanzi`) and 3 choices.
- Answer modes:
  - `Answers CN`: choices are **Pinyin**
  - `Answers EN`: choices are **English**
- Tap a choice:
  - Wrong: button turns red; streak resets to `0`; plays “pop”.
  - Correct: button turns green; speaks the character; advances to the next card; plays “ding”.
- Prompt audio:
  - Auto prompt says `这是什么字？` after each new card (once the app is started).
  - “Play audio” speaks the English word in CN mode, or the Mandarin character in EN mode.
- Audio requires a user gesture → the app gates with a Start button.

## Words dataset

- Source of truth: `src/data/words.ts`
- Each entry must have:
  - `id` unique + stable (used for options / deck)
  - `hanzi`, `pinyin`, `english`
- Current list is based on the Unit 2 literacy assessment photos.

## Write app

- Guided stroke-order practice using `hanzi-writer` (see `package.json`).
- Dataset: `src/apps/write/data/unit2.ts` (Unit 2 items marked with (W)).
- Any mistake during the word resets the “perfect streak” to `0`.
- Audio requires a user gesture → the app gates with a Start button.

## Celebration (both apps)

- Wrong answers / mistakes reset streak to `0`.
- Every streak milestone triggers confetti + “tada” + a big number flash:
  - `10`: 1 burst
  - `20`: 2 bursts
  - `30`: 3 bursts
  - etc.
- Flash animation lives in `src/index.css` (`@keyframes streak-flash`).

## GitHub Pages deploy

- Workflow: `.github/workflows/deploy.yml`
  - Builds on pushes to `main` or `master`
  - Uploads `dist/` as a Pages artifact and deploys via `actions/deploy-pages`
- Repo setting required:
  - GitHub **Settings → Pages → Source = GitHub Actions**
- Vite config sets `base: "./"` so assets work on Pages (see `vite.config.ts`).
- Custom domain is configured via `public/CNAME`.

## TypeScript gotcha we hit

- `tsc` can accidentally pick up global `@types/*` from parent directories.
- Fix is already applied: `typeRoots: ["./node_modules/@types"]` in:
  - `tsconfig.app.json`
  - `tsconfig.node.json`
