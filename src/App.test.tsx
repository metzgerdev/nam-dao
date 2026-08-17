import React from "react";
import { render, screen, within } from "@testing-library/react";
import App from "./App";
import { resetSampleCacheForTests } from "./utils/sampleLoader";

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

function setHashRoute(route) {
  window.location.hash = route;
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
    window.location.hash = "";
    jest.restoreAllMocks();
  });

  test("renders the home page on the default route", async () => {
    setHashRoute("");
    render(<App />);

    expect(await findView("Home")).toBeTruthy();
  });

  test("renders the work index on the work route", async () => {
    setHashRoute("#/work");
    render(<App />);

    expect(await findView("Work")).toBeTruthy();

    // "Work" also appears in the footer, so scope to the primary nav.
    const nav = screen.getByRole("navigation", { name: /primary/i });
    expect(
      within(nav).getByRole("link", { name: /^work$/i }).className,
    ).toContain("active");
  });

  test("renders a case study on a work detail route", async () => {
    setHashRoute("#/work/midi-gpt");
    render(<App />);

    expect(await findView("Midi GPT")).toBeTruthy();
  });

  test("renders a not-found case study for an unknown slug", async () => {
    setHashRoute("#/work/does-not-exist");
    render(<App />);

    expect(await findView("Project not found")).toBeTruthy();
  });

  test("renders the sequencer on the sequencer route", async () => {
    setHashRoute("#/sequencer");
    render(<App />);

    expect(await findView("Sequencer")).toBeTruthy();
  });

  test("renders the music player on the music-player route", async () => {
    setHashRoute("#/music-player");
    render(<App />);

    expect(await findView("Music Player")).toBeTruthy();
  });

  test("falls back to home for an unknown route", async () => {
    setHashRoute("#/not-a-real-route");
    render(<App />);

    expect(await findView("Home")).toBeTruthy();
  });
});
