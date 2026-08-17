import React from "react";
import { render, screen, within } from "@testing-library/react";
import App from "./App";
import { resetSampleCacheForTests } from "./utils/sampleLoader";
import { migrateLegacyHash } from "./routing";

class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = "running";
    this.destination = {};
  }

  suspend() {
    this.state = "suspended";
    return Promise.resolve();
  }

  resume() {
    this.state = "running";
    return Promise.resolve();
  }

  decodeAudioData() {
    return Promise.resolve({ sample: true });
  }
}

// Routing is path-based; drive it the way the browser would.
function setRoute(path) {
  window.history.pushState({}, "", path === "" ? "/" : `/${path}`);
}

async function findView(name: string) {
  return screen.findByRole("main", { name });
}

describe("App routes", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    resetSampleCacheForTests();
    global.AudioContext = jest.fn(() => new MockAudioContext());
    global.fetch = jest.fn(() =>
      Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      }),
    );
    global.structuredClone = (value) => {
      if (value instanceof Set) {
        return new Set(value);
      }
      if (Array.isArray(value)) {
        return value.map((item) => global.structuredClone(item));
      }
      if (value && typeof value === "object") {
        const output = {};
        Object.keys(value).forEach((key) => {
          output[key] = global.structuredClone(value[key]);
        });
        return output;
      }
      return value;
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    resetSampleCacheForTests();
    window.history.pushState({}, "", "/");
    jest.restoreAllMocks();
  });

  test("renders the home page on the default route", async () => {
    setRoute("");
    render(<App />);

    expect(await findView("Home")).toBeTruthy();
  });

  test("renders the work index on the work route", async () => {
    setRoute("work");
    render(<App />);

    expect(await findView("Work")).toBeTruthy();

    // "Work" also appears in the footer, so scope to the primary nav.
    const nav = screen.getByRole("navigation", { name: /primary/i });
    expect(
      within(nav).getByRole("link", { name: /^work$/i }).className,
    ).toContain("active");
  });

  test("renders a case study on a work detail route", async () => {
    setRoute("work/midi-gpt");
    render(<App />);

    expect(await findView("Midi GPT")).toBeTruthy();
  });

  test("renders a not-found case study for an unknown slug", async () => {
    setRoute("work/does-not-exist");
    render(<App />);

    expect(await findView("Project not found")).toBeTruthy();
  });

  test("renders the sequencer on the sequencer route", async () => {
    setRoute("sequencer");
    render(<App />);

    expect(await findView("Sequencer")).toBeTruthy();
  });

  test("renders the music player on the music-player route", async () => {
    setRoute("music-player");
    render(<App />);

    expect(await findView("Music Player")).toBeTruthy();
  });

  test("rewrites a legacy hash URL to the equivalent path", async () => {
    window.history.pushState({}, "", "/");
    window.location.hash = "#/work/midi-gpt";
    migrateLegacyHash();

    // Trailing slash: prerendered routes are directory indexes, so this is the
    // URL that serves without a redirect.
    expect(window.location.pathname).toBe("/work/midi-gpt/");
    expect(window.location.hash).toBe("");
  });

  test("falls back to home for an unknown route", async () => {
    setRoute("not-a-real-route");
    render(<App />);

    expect(await findView("Home")).toBeTruthy();
  });
});
