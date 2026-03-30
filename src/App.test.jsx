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

  test("renders the sequencer on the default route", () => {
    setHashRoute("");

    render(<App />);

    expect(screen.getByText(/rhythm composer/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /sequencer/i }).className).toContain("active");
  });

  test("renders the daw on the daw route", () => {
    setHashRoute("#/daw");

    render(<App />);

    expect(screen.getByText(/arrangement view/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /daw/i }).className).toContain("active");
  });
});
