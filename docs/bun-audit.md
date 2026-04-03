# Bun Tool Audit

This project now uses Bun as the primary package manager and test runner. Vite handles browser bundling and the local dev server.

## Replaced By Bun And Vite

| Tool                       | Previous role                    | Why it is redundant now                                                            |
| -------------------------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| `webpack`                  | Browser bundling                 | Replaced by Vite for development and production builds.                            |
| `webpack-cli`              | CLI wrapper for webpack          | No longer needed because build runs through Vite scripts.                          |
| `webpack-dev-server`       | Local dev server                 | Replaced by Vite's dev server.                                                     |
| `html-webpack-plugin`      | HTML generation                  | Vite uses `index.html` as the app entry and handles asset injection automatically. |
| `copy-webpack-plugin`      | Copying `public/` assets         | Vite copies `public/` assets into `dist/` during build.                            |
| `mini-css-extract-plugin`  | CSS extraction                   | Vite handles CSS bundling natively.                                                |
| `babel-loader`             | TSX/JSX transpilation in webpack | Vite plus the React plugin handle the browser build pipeline.                      |
| `css-loader`               | CSS imports from JS/TS           | Vite handles CSS imports natively.                                                 |
| `html-loader`              | HTML asset processing            | No longer needed with the Vite entry flow.                                         |
| `jest`                     | Test runner                      | Replaced by `bun test`.                                                            |
| `jest-environment-jsdom`   | DOM environment for Jest         | Replaced by Bun test preload plus `happy-dom`.                                     |
| `babel-jest`               | Babel transform for tests        | Bun runs TS/TSX tests natively.                                                    |
| `@babel/core`              | Babel compiler                   | Redundant after moving bundling and test transforms to Bun.                        |
| `@babel/preset-env`        | Babel JS transforms              | Redundant after moving transforms to Bun.                                          |
| `@babel/preset-react`      | JSX transform                    | Redundant after moving transforms to Bun.                                          |
| `@babel/preset-typescript` | TypeScript transform             | Redundant after moving transforms to Bun.                                          |
| `package-lock.json`        | npm lockfile                     | Replaced by `bun.lock`.                                                            |

## Still Needed

| Tool                        | Role                           | Why it stays                                                                 |
| --------------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| `react`                     | UI runtime                     | Bun is not a UI framework replacement.                                       |
| `react-dom`                 | React DOM renderer             | Still required to mount the app.                                             |
| `vite`                      | Dev server and browser bundler | Replaces the custom Bun-based build and serve scripts.                       |
| `@vitejs/plugin-react`      | React support in Vite          | Enables the React dev/build pipeline in Vite.                                |
| `typescript`                | Static type checking           | Bun transpiles TS, but it does not replace `tsc --noEmit` for type analysis. |
| `@testing-library/react`    | Component testing helpers      | Bun runs the tests, but it does not replace the testing API.                 |
| `@testing-library/dom`      | DOM querying utilities         | Still used by the testing stack.                                             |
| `@testing-library/jest-dom` | DOM-specific assertions        | Works with Bun's `expect`, so it remains useful.                             |
| `happy-dom`                 | DOM shim for Bun tests         | Bun test did not provide enough DOM globals for this suite by itself.        |
| `gh-pages`                  | GitHub Pages deployment        | Bun does not publish the built `dist/` directory to GitHub Pages.            |

## Not Replaced By Bun

| Tool                | Status                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `typescript-eslint` | Not replaced by Bun and removed here because the repo has no lint config or lint script. |
