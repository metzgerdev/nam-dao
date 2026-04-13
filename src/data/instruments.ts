const kickSample = new URL("./samples/kick.wav", import.meta.url).href;
const snareSample = new URL("./samples/snare.wav", import.meta.url).href;
const bassSample = new URL("./samples/bass.wav", import.meta.url).href;
const openHatSample = new URL("./samples/open.wav", import.meta.url).href;
const closedHatSample = new URL("./samples/closed-hat.wav", import.meta.url)
  .href;
const rideSample = new URL("./samples/ride.wav", import.meta.url).href;
const pianoSample = new URL("./samples/rev-piano.wav", import.meta.url).href;
const arpSample = new URL("./samples/melody.wav", import.meta.url).href;
const vocalOneSample = new URL("./samples/vocal-1.wav", import.meta.url).href;
const vocalTwoSample = new URL("./samples/vocal-2.wav", import.meta.url).href;

export const instrumentRows = [
  "Track 1",
  "Track 2",
  "Track 3",
  "Track 4",
  "Track 5",
  "Track 6",
  "Track 7",
  "Track 8",
  "Track 9",
  "Track 10",
] as const;

export type TrackLabel = (typeof instrumentRows)[number];

export interface InstrumentPattern {
  activeSteps: Set<number>;
  path: string;
}

export type DrumState = Record<TrackLabel, InstrumentPattern>;
export type AudioBufferMap = Record<TrackLabel, AudioBuffer | null>;

export const instruments: DrumState = {
  "Track 1": {
    activeSteps: new Set([0, 4, 8, 12]),
    path: kickSample,
  },
  "Track 2": {
    activeSteps: new Set([4, 12]),
    path: snareSample,
  },
  "Track 3": {
    activeSteps: new Set([2, 6, 10, 14]),
    path: openHatSample,
  },
  "Track 4": {
    activeSteps: new Set([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]),
    path: closedHatSample,
  },
  "Track 5": {
    activeSteps: new Set(),
    path: rideSample,
  },
  "Track 6": {
    activeSteps: new Set([0, 3, 6, 9, 12, 15]),
    path: bassSample,
  },
  "Track 7": {
    activeSteps: new Set(),
    path: pianoSample,
  },
  "Track 8": {
    activeSteps: new Set([0]),
    path: arpSample,
  },
  "Track 9": {
    activeSteps: new Set(),
    path: vocalOneSample,
  },
  "Track 10": {
    activeSteps: new Set(),
    path: vocalTwoSample,
  },
};
