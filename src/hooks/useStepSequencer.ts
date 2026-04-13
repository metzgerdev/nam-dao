import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import {
  instrumentRows,
  instruments,
  type AudioBufferMap,
  type DrumState,
  type InstrumentName,
} from "../data/instruments";
import { initDrumMachine } from "../utils/sampleLoader";
import {
  handleBPM,
  handleStart,
  scheduler,
  stopPlayback,
} from "../utils/playback";

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.1;
const STEP_COUNT = 16;
const STEP_GRID = Array.from({ length: STEP_COUNT }, () => false);

export interface SerializedPattern {
  version: 1;
  name: string;
  tempo: number;
  instruments: Record<InstrumentName, number[]>;
}

const DEFAULT_TRACK_LABELS: Record<InstrumentName, string> = Object.fromEntries(
  instrumentRows.map((instrument, index) => [instrument, `Track ${index + 1}`]),
) as Record<InstrumentName, string>;

function baseNameFromPath(path: string): string {
  const segment = path.split("/").pop() ?? path;
  const dot = segment.lastIndexOf(".");
  return dot === -1 ? segment : segment.slice(0, dot);
}

const DEFAULT_SAMPLE_NAMES: Record<InstrumentName, string> =
  Object.fromEntries(
    instrumentRows.map((instrument) => [
      instrument,
      baseNameFromPath(instruments[instrument].path),
    ]),
  ) as Record<InstrumentName, string>;

function clonePatternState(previousState: DrumState): DrumState {
  return structuredClone(previousState);
}

function createAudioBufferMap(): AudioBufferMap {
  return instrumentRows.reduce((accumulator, instrument) => {
    accumulator[instrument] = null;
    return accumulator;
  }, {} as AudioBufferMap);
}

interface StepSequencerState {
  audioBuffers: AudioBufferMap;
  currentStepRef: RefObject<number>;
  drumState: DrumState;
  handleTempoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  instrumentRows: readonly InstrumentName[];
  isDirty: boolean;
  isPlaying: boolean;
  loadSampleForInstrument: (
    instrument: InstrumentName,
    buffer: ArrayBuffer,
  ) => Promise<void>;
  markSaved: () => void;
  patternName: string;
  restorePattern: (data: SerializedPattern) => void;
  samplesLoaded: boolean;
  sampleNames: Record<InstrumentName, string>;
  serializePattern: () => SerializedPattern;
  setDrumState: Dispatch<SetStateAction<DrumState>>;
  setPatternName: (name: string) => void;
  setSampleName: (instrument: InstrumentName, name: string) => void;
  stepCount: number;
  steps: boolean[];
  tempo: number;
  togglePlayback: () => void;
  toggleStep: (type: InstrumentName, stepNumber: number) => void;
  trackLabels: Record<InstrumentName, string>;
}

export function useStepSequencer(): StepSequencerState {
  const [tempo, setTempo] = useState(123);
  const [drumState, setDrumState] = useState<DrumState>(instruments);
  const [trackLabels] = useState(DEFAULT_TRACK_LABELS);
  const [sampleNames, setSampleNames] = useState(DEFAULT_SAMPLE_NAMES);
  const [isPlaying, setIsPlaying] = useState(false);
  const [samplesLoaded, setSamplesLoaded] = useState(false);
  const [patternName, setPatternName] = useState("Untitled Pattern");
  const [isDirty, setIsDirty] = useState(false);
  const secondsPerStep = 60 / tempo / 4;
  const drumStateRef = useRef<DrumState>(instruments);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const sequencerClockId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioBufferRefs = useRef<AudioBufferMap>(createAudioBufferMap());

  useEffect(() => {
    let isMounted = true;

    async function bootDrumMachine() {
      await initDrumMachine({ audioContextRef, audioBufferRefs, drumStateRef });
      if (isMounted) {
        setSamplesLoaded(true);
      }
    }

    void bootDrumMachine();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    drumStateRef.current = drumState;
  }, [drumState]);

  useEffect(() => {
    if (isPlaying) {
      scheduler({
        audioContextRef,
        nextNoteTimeRef,
        currentStepRef,
        secondsPerStep,
        stepCount: STEP_COUNT,
        sequencerClockId,
        LOOKAHEAD_MS,
        SCHEDULE_AHEAD_SECONDS,
        drumStateRef,
        audioBufferRefs,
      });
    }

    return () => {
      clearTimeout(sequencerClockId.current ?? undefined);
      sequencerClockId.current = null;
    };
  }, [isPlaying, secondsPerStep]);

  function handleTempoChange(event: ChangeEvent<HTMLInputElement>) {
    handleBPM(event, setTempo);
    setIsDirty(true);
  }

  function togglePlayback() {
    handleStart({
      audioContextRef,
      isPlaying,
      setIsPlaying,
      nextNoteTimeRef,
      stopPlayback: () => stopPlayback(audioContextRef),
    });
  }

  function toggleStep(type: InstrumentName, stepNumber: number) {
    setDrumState((previousState) => {
      const nextState = clonePatternState(previousState);
      const { activeSteps } = nextState[type];
      if (activeSteps.has(stepNumber)) {
        activeSteps.delete(stepNumber);
      } else {
        activeSteps.add(stepNumber);
      }
      return nextState;
    });
    setIsDirty(true);
  }

  function setSampleName(instrument: InstrumentName, name: string): void {
    setSampleNames((previous) => ({ ...previous, [instrument]: name }));
  }

  async function loadSampleForInstrument(
    instrument: InstrumentName,
    buffer: ArrayBuffer,
  ): Promise<void> {
    if (!audioContextRef.current) return;
    const decoded = await audioContextRef.current.decodeAudioData(buffer);
    audioBufferRefs.current[instrument] = decoded;
  }

  function serializePattern(): SerializedPattern {
    const serializedInstruments = {} as Record<InstrumentName, number[]>;
    for (const key of instrumentRows) {
      serializedInstruments[key] = [...drumStateRef.current[key].activeSteps];
    }
    return { version: 1, name: patternName, tempo, instruments: serializedInstruments };
  }

  function markSaved(): void {
    setIsDirty(false);
  }

  function restorePattern(data: SerializedPattern): void {
    setTempo(data.tempo);
    if (data.name) setPatternName(data.name);
    setIsDirty(false);
    setDrumState((previous) => {
      const next = clonePatternState(previous);
      for (const key of instrumentRows) {
        const steps = data.instruments[key];
        if (steps) {
          next[key].activeSteps = new Set(steps);
        }
      }
      return next;
    });
  }

  return {
    audioBuffers: audioBufferRefs.current,
    currentStepRef,
    drumState,
    handleTempoChange,
    instrumentRows,
    isDirty,
    isPlaying,
    loadSampleForInstrument,
    markSaved,
    patternName,
    restorePattern,
    samplesLoaded,
    sampleNames,
    serializePattern,
    setDrumState,
    setPatternName,
    setSampleName,
    stepCount: STEP_COUNT,
    steps: STEP_GRID,
    tempo,
    togglePlayback,
    toggleStep,
    trackLabels,
  };
}
