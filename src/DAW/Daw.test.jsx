import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Daw from "./Daw";
import { resetSampleCacheForTests } from "../utils/sampleLoader";

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
    return Promise.resolve(createMockAudioBuffer());
  }
}

function createMockAudioBuffer() {
  return {
    getChannelData() {
      return new Float32Array([
        0,
        0.35,
        -0.2,
        0.55,
        -0.65,
        0.25,
        0.18,
        -0.42,
        0.72,
        -0.3,
        0.12,
        -0.08,
      ]);
    },
  };
}

function installStructuredClone() {
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
}

function getTrackButtons(trackLabel) {
  const heading = screen.getByRole("heading", { name: trackLabel });
  const track = heading.closest(".daw-track");
  return track.querySelectorAll(".daw-step-cell");
}

describe("Daw", () => {
  let audioContexts;

  beforeEach(() => {
    resetSampleCacheForTests();
    audioContexts = [];
    jest.useFakeTimers();

    global.AudioContext = jest.fn(() => {
      const context = new MockAudioContext();
      audioContexts.push(context);
      return context;
    });
    global.AudioBufferSourceNode = jest.fn(() => {
      return {
        buffer: null,
        connect: jest.fn(),
        start: jest.fn(),
      };
    });
    global.fetch = jest.fn(() =>
      Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      }),
    );
    installStructuredClone();
  });

  afterEach(() => {
    resetSampleCacheForTests();
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("renders the arrangement with the sequencer default pattern", async () => {
    render(<Daw />);

    expect(screen.getByRole("button", { name: /start/i })).toBeTruthy();
    expect(getTrackButtons("KICK")).toHaveLength(16);
    expect(getTrackButtons("KICK")[0].className).toContain("active");
    expect(getTrackButtons("KICK")[4].className).toContain("active");
    expect(getTrackButtons("SNARE")[4].className).toContain("active");
    expect(getTrackButtons("OPEN HAT")[2].className).toContain("active");
    expect(getTrackButtons("CLOSED HAT")[15].className).toContain("active");
    expect(getTrackButtons("ARP1")[0].className).toContain("active");

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await waitFor(() => {
      const waveformFill = getTrackButtons("KICK")[0].querySelector(".daw-clip-waveform-fill");
      const waveformGuide = getTrackButtons("KICK")[0].querySelector(".daw-clip-waveform-guide");
      expect(waveformFill).toBeTruthy();
      expect(waveformFill.getAttribute("d")).toContain("Z");
      expect(waveformGuide).toBeTruthy();
      expect(screen.queryByText(/clip/i)).toBeNull();
    });
  });

  test("toggles an arrangement step on click", () => {
    render(<Daw />);
    const kickStep = getTrackButtons("KICK")[1];
    expect(kickStep.className).toBe("daw-step-cell");

    fireEvent.click(kickStep);

    expect(kickStep.className).toContain("active");
  });

  test("starts playback from the daw transport", () => {
    render(<Daw />);

    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    expect(screen.getByRole("button", { name: /stop/i })).toBeTruthy();
  });

  test("schedules active clips during playback", async () => {
    render(<Daw />);
    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    const context = audioContexts[0];
    context.currentTime = 0.001;

    act(() => {
      jest.advanceTimersByTime(30);
    });

    await waitFor(() => {
      expect(global.AudioBufferSourceNode).toHaveBeenCalled();
      expect(global.AudioBufferSourceNode.mock.calls.length).toBeGreaterThan(0);
      expect(global.AudioBufferSourceNode.mock.calls.length).toBeLessThan(10);
    });
  });
});
