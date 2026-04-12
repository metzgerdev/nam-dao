import React from "react";
import { render, screen } from "@testing-library/react";
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
  beforeEach(() => {
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
    resetSampleCacheForTests();
    window.location.hash = "";
    jest.restoreAllMocks();
  });

  test("renders the home page on the default route", async () => {
    setHashRoute("");
    render(<App />);

    expect(await findView("Home")).toBeTruthy();
    expect(screen.getByRole("link", { name: /home/i }).className).toContain("active");
  });

  test("renders the sequencer on the sequencer route", async () => {
    setHashRoute("#/sequencer");
    render(<App />);

    expect(await findView("Sequencer")).toBeTruthy();
    expect(screen.getByRole("link", { name: /sequencer/i }).className).toContain("active");
  });

  test("renders the daw on the daw route", async () => {
    setHashRoute("#/daw");
    render(<App />);

    expect(await findView("DAW")).toBeTruthy();
    expect(screen.getByRole("link", { name: /daw/i }).className).toContain("active");
  });

  test("renders the music player on the music-player route", async () => {
    setHashRoute("#/music-player");
    render(<App />);

    expect(await findView("Music Player")).toBeTruthy();
    expect(screen.getByRole("link", { name: /music player/i }).className).toContain("active");
  });

  test("renders the too fast too furious route", async () => {
    setHashRoute("#/too-fast-too-furious");
    render(<App />);

    expect(await findView("Machines")).toBeTruthy();
    expect(screen.getByRole("link", { name: /machines/i }).className).toContain("active");
  });
});
