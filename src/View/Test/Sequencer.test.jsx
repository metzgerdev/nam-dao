import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Sequencer from "../../DrumMachine/Sequencer";
import { resetSampleCacheForTests } from "../../utils/sampleLoader";

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

describe("Sequencer", () => {
  let sourceInstances;
  let audioContexts;

  beforeEach(() => {
    resetSampleCacheForTests();
    sourceInstances = [];
    audioContexts = [];
    jest.useFakeTimers();

    global.AudioContext = jest.fn(() => {
      const context = new MockAudioContext();
      audioContexts.push(context);
      return context;
    });
    global.AudioBufferSourceNode = jest.fn(() => {
      const instance = {
        buffer: null,
        connect: jest.fn(),
        start: jest.fn(),
      };
      sourceInstances.push(instance);
      return instance;
    });

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
        const out = {};
        Object.keys(value).forEach((key) => {
          out[key] = global.structuredClone(value[key]);
        });
        return out;
      }
      return value;
    };
  });

  afterEach(() => {
    resetSampleCacheForTests();
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function getRowButtons(rowLabel) {
    const rowName = screen.getByText(rowLabel);
    const row = rowName.closest(".row-block");
    return row.querySelectorAll("button.step");
  }

  test("renders initial UI with transport, tempo, rows, and 16-step grid", async () => {
    render(<Sequencer />);
    expect(screen.getByRole("button", { name: /start/i })).toBeTruthy();
    expect(screen.getByText(/tempo 123 bpm/i)).toBeTruthy();
    expect(getRowButtons("kick")).toHaveLength(16);
    expect(getRowButtons("snare")).toHaveLength(16);
    expect(getRowButtons("vocal2")).toHaveLength(16);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  test("toggles a step on click (inactive -> active)", () => {
    render(<Sequencer />);
    const kickButtons = getRowButtons("kick");
    const step1 = kickButtons[1];
    expect(step1.className).toBe("step");
    fireEvent.click(step1);
    expect(step1.className).toContain("active");
  });

  test("toggles a step off when clicked again (active -> inactive)", () => {
    render(<Sequencer />);
    const kickButtons = getRowButtons("kick");
    const step0 = kickButtons[0];
    expect(step0.className).toContain("active");
    fireEvent.click(step0);
    expect(step0.className).toBe("step");
  });

  test("start button changes to stop while playing", () => {
    render(<Sequencer />);
    const transport = screen.getByRole("button", { name: /start/i });
    fireEvent.click(transport);
    expect(screen.getByRole("button", { name: /stop/i })).toBeTruthy();
  });

  test("stop button changes back to start", () => {
    render(<Sequencer />);
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    fireEvent.click(screen.getByRole("button", { name: /stop/i }));
    expect(screen.getByRole("button", { name: /start/i })).toBeTruthy();
  });

  test("tempo slider updates tempo label", () => {
    render(<Sequencer />);
    const slider = screen.getByRole("slider");
    fireEvent.input(slider, { target: { value: "140" } });
    expect(screen.getByText(/tempo 140 bpm/i)).toBeTruthy();
  });

  test("progress row active cell advances during playback ticks", async () => {
    render(<Sequencer />);
    const progressRow = screen.getByText("position").closest(".row-block");
    const initialActiveCount = progressRow.querySelectorAll(".step.cell.active").length;
    expect(initialActiveCount).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    const context = audioContexts[0];
    context.currentTime = 1;
    act(() => {
      jest.advanceTimersByTime(50);
    });

    await waitFor(() => {
      const activeCells = progressRow.querySelectorAll(".step.cell.active");
      expect(activeCells.length).toBe(1);
      expect(activeCells[0].textContent).not.toBe("1");
    });
  });

  test("progress row buttons are disabled", () => {
    render(<Sequencer />);
    const progressRow = screen.getByText("position").closest(".row-block");
    const progressButtons = progressRow.querySelectorAll("button.step");
    expect(progressButtons.length).toBe(16);
    progressButtons.forEach((button) => {
      expect(button.disabled).toBe(true);
    });
  });

  test("schedules only active-step samples for a tick", async () => {
    render(<Sequencer />);
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

  test("clears scheduler timeout on unmount", () => {
    const { unmount } = render(<Sequencer />);
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    expect(jest.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});
