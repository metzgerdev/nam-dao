const BASS = "bass";
const KICK = "kick";
const SNARE = "snare";
const CLOSEDHAT = "closedHat";
const OPENHAT = "openHat";
const RIDE = "ride";
const PIANO = "piano";
const ARP1 = "arp1";
const VOCAL1 = "vocal1";
const VOCAL2 = "vocal2";

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
  KICK,
  SNARE,
  OPENHAT,
  CLOSEDHAT,
  RIDE,
  BASS,
  PIANO,
  ARP1,
  VOCAL1,
  VOCAL2,
] as const;

export type InstrumentName = (typeof instrumentRows)[number];

export interface InstrumentPattern {
  activeSteps: Set<number>;
  path: string;
}

export type DrumState = Record<InstrumentName, InstrumentPattern>;
export type AudioBufferMap = Record<InstrumentName, AudioBuffer | null>;

export const instruments: DrumState = {
  [KICK]: {
    activeSteps: new Set([0, 4, 8, 12]),
    path: kickSample,
  },
  [SNARE]: {
    activeSteps: new Set([4, 12]),
    path: snareSample,
  },
  [BASS]: {
    activeSteps: new Set([0, 3, 6, 9, 12, 15]),
    path: bassSample,
  },
  [OPENHAT]: {
    activeSteps: new Set([2, 6, 10, 14]),
    path: openHatSample,
  },
  [CLOSEDHAT]: {
    activeSteps: new Set([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]),
    path: closedHatSample,
  },
  [RIDE]: {
    activeSteps: new Set(),
    path: rideSample,
  },
  [PIANO]: {
    activeSteps: new Set(),
    path: pianoSample,
  },
  [ARP1]: {
    activeSteps: new Set([0]),
    path: arpSample,
  },
  [VOCAL1]: {
    activeSteps: new Set(),
    path: vocalOneSample,
  },
  [VOCAL2]: {
    activeSteps: new Set(),
    path: vocalTwoSample,
  },
};
