# Bun Tool Audit

This project now uses Bun as the primary package manager, test runner, bundler, and local dev server.

## Replaced By Bun

| Tool | Previous role | Why it is redundant now |
| --- | --- | --- |
| `webpack` | Browser bundling | `Bun.build()` now produces the browser bundle directly. |
| `webpack-cli` | CLI wrapper for webpack | No longer needed because build runs through Bun scripts. |
| `webpack-dev-server` | Local dev server | Replaced by `scripts/dev.ts` using `Bun.serve()`. |
| `html-webpack-plugin` | HTML generation | `scripts/build.ts` injects the built script and stylesheet into `index.html`. |
| `copy-webpack-plugin` | Copying `public/` assets | `scripts/build.ts` copies `public/` into `dist/`. |
| `mini-css-extract-plugin` | CSS extraction | Bun emits the CSS bundle from the imported stylesheet. |
| `babel-loader` | TSX/JSX transpilation in webpack | Bun transpiles TypeScript and React syntax natively. |
| `css-loader` | CSS imports from JS/TS | Bun handles CSS imports during bundling. |
| `html-loader` | HTML asset processing | No longer needed with the Bun build flow. |
| `jest` | Test runner | Replaced by `bun test`. |
| `jest-environment-jsdom` | DOM environment for Jest | Replaced by Bun test preload plus `happy-dom`. |
| `babel-jest` | Babel transform for tests | Bun runs TS/TSX tests natively. |
| `@babel/core` | Babel compiler | Redundant after moving bundling and test transforms to Bun. |
| `@babel/preset-env` | Babel JS transforms | Redundant after moving transforms to Bun. |
| `@babel/preset-react` | JSX transform | Redundant after moving transforms to Bun. |
| `@babel/preset-typescript` | TypeScript transform | Redundant after moving transforms to Bun. |
| `package-lock.json` | npm lockfile | Replaced by `bun.lock`. |

## Still Needed

| Tool | Role | Why it stays |
| --- | --- | --- |
| `react` | UI runtime | Bun is not a UI framework replacement. |
| `react-dom` | React DOM renderer | Still required to mount the app. |
| `typescript` | Static type checking | Bun transpiles TS, but it does not replace `tsc --noEmit` for type analysis. |
| `@testing-library/react` | Component testing helpers | Bun runs the tests, but it does not replace the testing API. |
| `@testing-library/dom` | DOM querying utilities | Still used by the testing stack. |
| `@testing-library/jest-dom` | DOM-specific assertions | Works with Bun's `expect`, so it remains useful. |
| `happy-dom` | DOM shim for Bun tests | Bun test did not provide enough DOM globals for this suite by itself. |
| `gh-pages` | GitHub Pages deployment | Bun does not publish the built `dist/` directory to GitHub Pages. |

## Not Replaced By Bun

| Tool | Status |
| --- | --- |
| `typescript-eslint` | Not replaced by Bun and removed here because the repo has no lint config or lint script. |
