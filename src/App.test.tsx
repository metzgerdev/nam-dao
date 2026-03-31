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

  test("renders the home page on the default route", () => {
    setHashRoute("");

    render(<App />);

    expect(screen.getByRole("heading", { name: /nam dao/i })).toBeTruthy();
    expect(screen.getByText(/i release music as zynar/i)).toBeTruthy();
    expect(screen.getByText(/projects/i)).toBeTruthy();
    expect(screen.getByText(/roland 909 inspired drum machine/i)).toBeTruthy();
    expect(
      screen.getByText(
        /i previously worked at nginx \(f5 networks\), rescale, and nintendo of america/i,
      ),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: /home/i }).className).toContain("active");
  });

  test("renders the sequencer on the sequencer route", () => {
    setHashRoute("#/sequencer");

    render(<App />);

    expect(screen.getByText(/rhythm composer/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /sequencer/i }).className).toContain("active");
  });

  test("renders the daw on the daw route", () => {
    setHashRoute("#/daw");

    render(<App />);

    expect(screen.getByRole("button", { name: /start/i })).toBeTruthy();
    expect(screen.getByText(/1 bar \/ 16 steps/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /daw/i }).className).toContain("active");
  });

  test("renders the too fast too furious route", () => {
    setHashRoute("#/too-fast-too-furious");

    render(<App />);

    expect(screen.getByRole("heading", { name: /my cars/i })).toBeTruthy();
    expect(screen.getByAltText(/silver bmw convertible/i)).toBeTruthy();
    expect(screen.getByAltText(/matte black porsche coupe/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /too fast too furious/i }).className).toContain("active");
  });
});
