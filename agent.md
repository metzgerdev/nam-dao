# Agent Guide

## Project

This repository contains a browser-based music app centered on two related UIs:

- A classic drum sequencer in `src/View/` with supporting logic in `src/utils/*.js`
- A more advanced DAW experience in `src/DAW/`

The app is React-based and bundled with Webpack.

## Main Goals

- Keep playback timing stable
- Preserve waveform-driven clip rendering
- Respect sixteenth-note quantization in the DAW
- Prefer targeted refactors over broad rewrites unless explicitly requested

## Important Paths

- `src/App.jsx`
- `src/index.js`
- `src/View/Sequencer.jsx`
- `src/View/ProgressBar.jsx`
- `src/utils/playback.js`
- `src/utils/sampleLoader.js`
- `src/DAW/`
- `src/Style/index.css`

## Commands

Install dependencies:

```bash
npm install
```

Start local dev server:

```bash
npm run serve
```

Run tests:

```bash
npm test
```

Run a focused test:

```bash
npx jest path/to/test --runInBand
```

Build production bundle:

```bash
npm run build
```

Typecheck:

```bash
npm run typecheck
```

## Working Rules

- Do not overwrite unrelated user changes.
- Favor small, reversible patches.
- Run focused tests for changed files before finishing.
- Create a git commit after each completed change.
- Treat playback regressions as higher priority than cosmetic changes.
- Keep clip visuals tied to decoded audio data, not placeholder shapes.
- Favor small modular functions with semantic names
- After a complete change, commit and write a succinct message

## DAW Notes

- The DAW timeline is quantized to sixteenth notes.
- Clip movement should stay snapped to the grid unless the product direction changes.
- Audio scheduling and UI rendering should stay as decoupled as possible.
- When refactoring playback, preserve loop behavior, scrub behavior, and clip offset correctness.

## Testing Notes

- Some repo-level typecheck noise may come from existing test files rather than the current change.
- Prefer validating behavior with focused Jest runs around the affected DAW or sequencer flows.
