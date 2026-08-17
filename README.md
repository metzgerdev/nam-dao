<div align="center">

# Nam Dao — Portfolio

AI engineer portfolio and blog. Case studies on LLM and generative-audio work, plus two live audio demos built on the Web Audio API.

[Live Site](https://metzgerdev.github.io/nam-dao/) · [Tech Stack](#tech-stack) · [Local Setup](#local-setup)

</div>

---

## What's here

| Route | Contents |
| --- | --- |
| `/` | Positioning, selected work, demos |
| `/work/` | Full project index — AI/ML and interface engineering |
| `/work/<slug>/` | Case study per project |
| `/blog/` | Long-form writing |
| `/blog/<slug>/` | Article |
| `/sequencer/` | Live demo — TR-909 step sequencer |
| `/music-player/` | Live demo — player with a K-weighted VU meter |

Every route is prerendered to a static HTML file at build time, so each one is a real 200 with its own title and description rather than a client-rendered shell. Legacy `#/…` links from before the routing change are rewritten in place and still resolve.

Project content lives in [`src/data/projects.ts`](src/data/projects.ts) and drives the home page, the work index, and every case study from one source.

## Design

The site chrome is deliberately restrained: near-black surfaces, hairline rules instead of shadows, a system serif for display type and a monospace for labels and metrics. No web fonts — the page ships a strict CSP that forbids external hosts, so everything is a system stack.

Styles are split by intent:

- [`src/Style/tokens.css`](src/Style/tokens.css) — colour, type and spacing tokens
- [`src/Style/site.css`](src/Style/site.css) — nav, hero, work list, case studies, about, footer
- [`src/Style/instruments.css`](src/Style/instruments.css) — the sequencer and music player, which keep their hardware/skeuomorphic aesthetic on purpose

## Demos

### Sequencer

A drum machine inspired by the Roland TR-909. The audio engine and the UI are intentionally decoupled: timing, scheduling and sample triggering run through the Web Audio layer with refs and a lookahead scheduler, while React only edits pattern state and renders the interface. That separation keeps playback smooth by never coupling audio to React render cycles.

### Music Player

Built around my own music and remix work under the Zynar project. Instead of wiring the UI to static data, it uses a mock GraphQL layer with TanStack Query to simulate a more realistic frontend architecture. The route is lazy-loaded, library and track-duration requests are cached, and the audio element preloads metadata so the UI becomes responsive before playback is ready.

The VU meter computes RMS energy and runs the signal through a K-weighted filter chain, which tracks human loudness perception more closely than a simple peak meter.

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, TypeScript |
| Build Tooling | Vite |
| Data Layer | GraphQL, TanStack Query |
| Runtime / Scripts | Bun |
| Testing | Bun test, Testing Library |

## Local Setup

This repo uses Bun as the package manager and task runner.

### 1. Install Bun

On macOS:

```bash
curl -fsSL https://bun.sh/install | bash
exec /bin/zsh
```

Confirm the install:

```bash
bun --version
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Start The Dev Server

```bash
bun run dev
```

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the local development server |
| `bun run build` | Create a production build |
| `bun run build:static` | Production build plus prerendering (used by deploy) |
| `bun test` | Run the test suite |
| `bun run lint` | Lint |
| `bun run typecheck` | Type-check without emitting |
| `bun run format` | Format the project |
| `bun run format:check` | Check formatting without writing files |
