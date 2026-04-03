import { initDrumMachine, resetSampleCacheForTests } from "./sampleLoader";

class MockAudioContext {
  decodeAudioData(arrayBuffer) {
    return Promise.resolve({
      byteLength: arrayBuffer.byteLength,
      decoded: true,
    });
  }
}

function createLoaderState() {
  return {
    audioBufferRefs: { current: { kick: null, snare: null } },
    audioContextRef: { current: null },
    drumStateRef: {
      current: {
        kick: { path: "./kick.wav" },
        snare: { path: "./snare.wav" },
      },
    },
  };
}

describe("sampleLoader", () => {
  beforeEach(() => {
    resetSampleCacheForTests();
    global.AudioContext = jest.fn(() => new MockAudioContext());
    global.fetch = jest.fn(() =>
      Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(16)),
      }),
    );
  });

  afterEach(() => {
    resetSampleCacheForTests();
    jest.restoreAllMocks();
  });

  test("precomputes and reuses a shared decoded sample bank", async () => {
    const firstLoaderState = createLoaderState();
    const secondLoaderState = createLoaderState();

    const firstSampleBank = await initDrumMachine(firstLoaderState);
    const secondSampleBank = await initDrumMachine(secondLoaderState);

    expect(global.AudioContext).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(firstSampleBank).toBe(secondSampleBank);
    expect(firstLoaderState.audioBufferRefs.current).toBe(secondSampleBank);
    expect(secondLoaderState.audioBufferRefs.current).toBe(secondSampleBank);
  });
});
