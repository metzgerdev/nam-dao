<div align="center">

# Drum Machine

React based audio widgets with a modern JS toolchain: a Roland TR-909 inspired sequencer, a lightweight DAW, and a music player built around my electronic music project, Zynar.  Aesthetics are balanced with performance.

[Live Demo](https://metzgerdev.github.io/Drum-Machine/) · [Tech Stack](#tech-stack) · [Local Setup](#local-setup)

</div>

---

## Apps

| Module | Function |
| --- | --- |
| `SEQ-01` | TR-909 inspired step sequencer |
| `DAW-02` | Lightweight DAW / arrangement interface |
| `PLY-03` | Music player powered by a mock GraphQL data layer |

## Inspiration

This project started as a browser drum machine and evolved into:

- A TR-909 inspired step sequencer
- A simplified DAW / arrangement surface
- A music player for my own music and remix work

The project is a labor of passion, the result of crafting pleasing and functional UI and my background in electrical engineering and audio processing. 

## Screenshots

<table>
  <tr>
    <td width="50%">
      <p><strong>MODULE 01 / SEQ-01</strong></p>
      <img src="docs/screenshots/sequencer.png" alt="Sequencer screenshot" />
      <p>Pattern-based drum programming with a hardware-inspired interface and Dropbox integration.</p>
    </td>
    <td width="50%">
      <p><strong>MODULE 02 / DAW-02</strong></p>
      <img src="docs/screenshots/daw.png" alt="DAW screenshot" />
      <p>Evolution of the sequencer into a lightweight digital audio workstation. </p>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <p><strong>MODULE 03 / PLY-03</strong></p>
      <img src="docs/screenshots/music-player.png" alt="Music Player screenshot" />
      <p>A sleek music player for my own tracks with a production-style data flow.</p>
    </td>
  </tr>
</table>

## Modules

### Sequencer

Drum machine inspired by the Roland TR-909. It focuses on quick pattern building, and sample-triggered playback in a hardware inspspired interface.  Dropbox integration allows for colloborative sessions (samples and patterns can be shared).

For performance, the audio engine and the UI are intentionally decoupled. Timing, scheduling, and sample triggering run through the Web Audio layer with refs and a lookahead scheduler, while React is responsible for editing pattern state and rendering the interface. That separation keeps playback smooth by avoiding audio coupling to React render cycles.

### DAW

The sequencer is the basis for a lightweight DAW. 


### Music Player

The Music Player is centered around my own music and remix work under the Zynar project. Instead of wiring the UI directly to static data, I used a mock GraphQL layer together with TanStack Query to simulate a more realistic frontend architecture.

The route is lazy-loaded for a fast initial render, library and track-duration requests are cached through TanStack Query, and the audio element uses metadata preloading so the UI can become responsive before full media playback begins.

The VU meter demonstrates my audio and electrical engineering background. It computes RMS energy and runs the signal through a K-weighted filter which tracks human loudness perception more closely than a simple peak meter. 

### Music Player Data Flow

- Track data is requested through `/graphql`
- A local GraphQL schema resolves library and track queries
- TanStack Query manages loading, caching, and async UI state
- Artwork and audio previews are served as versioned app assets

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
| `bun test` | Run the test suite |
| `bun run format` | Format the project |
| `bun run format:check` | Check formatting without writing files |
