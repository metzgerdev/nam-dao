# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test
- Always run `bun run test` before committing changes
- Use `bun run lint` to check code style

## Never Do
- Never commit .env files or hardcoded secrets
- Never suggest or execute destructive commands (rm -rf, DROP TABLE, force push) without explicit confirmation


## Commands

```bash
bun run dev          # Start dev server
bun run build        # Production build
bun test             # Run all tests
bun test --watch     # Run tests in watch mode
bun run lint         # Lint
bun run lint:fix     # Lint and auto-fix
bun run format       # Format with Prettier
bun run typecheck    # Type-check without emitting
```

To run a single test file:
```bash
bun test src/View/Test/Sequencer.test.tsx
```

Deploy to GitHub Pages via `bun run deploy` (runs `predeploy` build first).

## Architecture

This is Nam Dao's professional portfolio, targeting hiring managers for **AI engineer** roles. The AI/ML case studies are the primary content; the two audio demos are secondary craft evidence and should stay ranked below the ML work.

The app is a single-page app with a custom **path-based** router in `src/App.tsx`. All views are lazy-loaded via `React.lazy`. Routes: `/`, `/work/`, `/work/<slug>/`, `/blog/`, `/blog/<slug>/`, `/sequencer/`, `/music-player/`. Unknown routes fall back to Home.

`src/routing.ts` owns all URL handling: `hrefFor()` builds hrefs (always with a trailing slash, because prerendered routes are directory indexes and a static host would otherwise 301), `currentPath()` parses, and `migrateLegacyHash()` rewrites old `#/…` URLs in place so previously shared links still resolve. A single delegated click listener in `App.tsx` turns in-app anchors into `pushState` navigations, which keeps every link a plain `href` that still works with JavaScript disabled.

### Prerendering

`bun run build:static` runs `vite build` then `scripts/prerender.ts`, which drives a headless browser over every route and writes `dist/<route>/index.html`. That makes each URL a real static 200 with full markup and its own `<title>`/description/canonical/og tags — crawlers that do not run JavaScript see the content. It also regenerates `sitemap.xml` and `404.html`.

`predeploy` uses `build:static`, so `bun run deploy` always ships prerendered output. Plain `bun run build` skips prerendering and stays fast for local work.

Two constraints are baked into that script and worth knowing before editing it:
- It does **not** use `vite preview`. Vite answers 404 to any request carrying `Sec-Fetch-Dest: script`, which is exactly what a browser sends for `<script type="module">`, so the app never boots and every route captures an empty shell.
- It serves via `Bun.serve` with an SPA fallback, because a plain static server 404s `/work` — that file is what the script is about to create.

Add a blog post and you must add its route to `ROUTES` in `scripts/prerender.ts`; `articles.ts` imports `?raw` markdown, which only resolves inside Vite.

### Content

**All project content lives in `src/data/projects.ts`** — a single `Project[]` that drives the home page, the work index, and every case study. Add or edit a project there rather than in a view. `featured: true` surfaces it on the home page; `kind: "ai" | "craft"` sorts it into the right section of `/work/`.

Case-study copy is factual and sourced from the actual repo READMEs, including limitations sections. Do not add metrics or claims that are not backed by the source repo.

### Styling

Split by intent, imported in order from `src/Style/index.css`:

- `tokens.css` — colour, type and spacing custom properties
- `site.css` — site chrome: nav, hero, work list, case studies, footer
- `instruments.css` — the sequencer and music player only

The site chrome uses the "Velvet Sandstone" palette: a warm off-white canvas, hairline rules instead of shadows, a system serif (`--font-display`) for headings and a monospace (`--font-mono`) for labels and metrics.

None of the five palette swatches is dark enough for body text — the darkest measures 4.47:1 on the canvas — so the ink tokens are derived and every one is annotated with its contrast ratio in `tokens.css`. Keep that invariant: any new text colour must clear 4.5:1 against the surface it sits on. Sand and blush are mixed back toward the canvas before use as surfaces for the same reason.

Type scales from one lever: `html { font-size: 107% }`. Everything is in `rem`, and the `vw` term of each `font-size: clamp()` is scaled to match, so the ratio holds at every viewport width.

The instrument views deliberately keep their hardware/skeuomorphic look — **do not** restyle them to match the site chrome.

No web fonts: `index.html` ships a strict CSP with `default-src 'self'`, so all typefaces must be system stacks and all assets must be local.

### Views

**SEQ-01 — Sequencer** (`src/View/DrumMachine/Sequencer.tsx`)
The audio engine is intentionally decoupled from React. Timing, scheduling, and sample triggering run entirely through the Web Audio API using refs and a lookahead scheduler (`src/utils/playback.ts`). React only manages pattern state and renders the UI. `useStepSequencer` (`src/hooks/useStepSequencer.ts`) is the central hook that owns all sequencer state and wires the audio engine to the UI.

Key constants: `LOOKAHEAD_MS = 25`, `SCHEDULE_AHEAD_SECONDS = 0.1`, `STEP_COUNT = 16`.

**PLY-03 — Music Player** (`src/View/MusicPlayer/MusicPlayer.tsx`)
Uses a mock GraphQL layer (`src/View/MusicPlayer/mockMusicPlayerApi.ts`) that intercepts `fetch` calls to `/graphql` and resolves them client-side using the `graphql` package. TanStack Query (`@tanstack/react-query`) manages caching and async state. The `QueryClient` is created in `src/queryClient.ts` and provided at the app root.

The VU meter (`src/View/MusicPlayer/components/VuMeter.tsx`, `src/View/MusicPlayer/vuMeterUtils.ts`) computes RMS energy and runs it through a K-weighted IIR filter chain for perceptual loudness tracking.

### Data

Instrument definitions and default patterns live in `src/data/instruments.ts`. `DrumState` is `Record<InstrumentName, InstrumentPattern>` where `activeSteps` is a `Set<number>`. Samples are `.wav` files under `src/data/samples/`.

Music player track data (audio `.m4a`, artwork `.avif`) lives co-located in `src/View/MusicPlayer/data/` and is referenced via `import.meta.url` for Vite asset handling.

### Build

`vite.config.ts` reads `homepage` from `package.json` to set the production base path for GitHub Pages deployment. In dev mode the base is always `/`.

### Testing

Tests use Bun's test runner with Testing Library and `happy-dom`. Test files live in `src/View/Test/` and alongside utilities (e.g. `src/utils/sampleLoader.test.tsx`).
