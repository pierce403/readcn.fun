# readcn.fun – agent notes

## Stack + commands

- React + TypeScript + Vite, compiled to static `dist/`
- Tailwind CSS v4 via `@tailwindcss/vite` (see `vite.config.ts`)
- Local:
  - `npm install`
  - `npm run dev`
  - `npm run build` (runs `tsc -b` then `vite build`)

## Game behavior (current)

- Shows one Chinese character (`hanzi`) and 3 English choices.
- Tap a choice:
  - Wrong: that button turns red and is disabled.
  - Correct: turns green, locks input briefly, then advances to next word.
- Sound + celebration:
  - Wrong plays a short “pop”, correct plays a “ding” (Web Audio API).
  - Streak counts only first-try correct answers; any wrong guess resets it to `0`.
  - Every streak milestone (10, 20, 30...) triggers confetti + a “tada”.
- Audio:
  - Uses Web Speech API (`speechSynthesis`) to say `这是什么字？` (prompt) when a new card appears.
  - Says the target character only after you select the correct answer.
  - Browsers require a user gesture before speech will play; keep a “Start/Play audio” button.
- Switches:
  - Bottom-right toggles for Audio On/Off and Answers EN/CN.
    - `EN`: prompt is Hanzi, answers are English.
    - `CN`: prompt is Hanzi, answers are Pinyin.
  - “Play audio” button reads the prompt:
    - `CN` mode: speaks the English word.
    - `EN` mode: speaks the Hanzi (Mandarin).

## Words dataset

- Source of truth: `src/data/words.ts`
- Each entry must have:
  - `id` unique + stable (used for options / deck)
  - `hanzi`, `pinyin`, `english`
- Current list is based on the provided Unit 2 literacy assessment photos.

## GitHub Pages deploy

- Workflow: `.github/workflows/deploy.yml`
  - Builds on pushes to `main` or `master`
  - Uploads `dist/` as a Pages artifact and deploys via `actions/deploy-pages`
- Repo setting required:
  - GitHub **Settings → Pages → Source = GitHub Actions**
- Vite config sets `base: "./"` so assets work on Pages (see `vite.config.ts`).

## TypeScript gotcha we hit

- `tsc` can accidentally pick up global `@types/*` from parent directories.
- Fix is already applied: `typeRoots: ["./node_modules/@types"]` in:
  - `tsconfig.app.json`
  - `tsconfig.node.json`
