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
];

export const instruments = {
  [KICK]: {
    activeSteps: new Set([0, 4, 8, 12]),
    path: "./drum machine 123 bpm kick.wav",
  },
  [SNARE]: {
    activeSteps: new Set([4, 12]),
    path: "./one shot snare.wav",
  },
  [BASS]: {
    activeSteps: new Set([0, 3, 6, 9, 12, 15]),
    path: "./drum machine 123 bpm bass.wav",
  },

  [OPENHAT]: {
    activeSteps: new Set([2, 6, 10, 14]),
    path: "./drum machine 123 bpm open.wav",
  },
  [CLOSEDHAT]: {
    activeSteps: new Set([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]),
    path: "./drum machine 123 bpm closed hat.wav",
  },
  [RIDE]: {
    activeSteps: new Set(),
    path: "./drum machine 123 bpm ride.wav",
  },
  [PIANO]: {
    activeSteps: new Set(),
    path: "./drum machine 123 bpm rev piano.wav",
  },
  [ARP1]: {
    activeSteps: new Set([0]),
    path: "./melody.wav",
  },
  [VOCAL1]: {
    activeSteps: new Set(),
    path: "./drum machine 123 bpm vocal 1.wav",
  },

  [VOCAL2]: {
    activeSteps: new Set(),
    path: "./drum machine 123 bpm vocal 2.wav",
  },
};
