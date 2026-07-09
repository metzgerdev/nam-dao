import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from "react";
import {
  instrumentRows,
  instruments,
  type AudioBufferMap,
  type DrumState,
  type TrackLabel,
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

function baseNameFromPath(path: string): string {
  const segment = path.split("/").pop() ?? path;
  const dot = segment.lastIndexOf(".");
  return dot === -1 ? segment : segment.slice(0, dot);
}

const DEFAULT_SAMPLE_NAMES: Record<TrackLabel, string> = Object.fromEntries(
  instrumentRows.map((track) => [track, baseNameFromPath(instruments[track].path)]),
) as Record<TrackLabel, string>;

function clonePatternState(previousState: DrumState): DrumState {
  return structuredClone(previousState);
}

function createAudioBufferMap(): AudioBufferMap {
  return instrumentRows.reduce((accumulator, track) => {
    accumulator[track] = null;
    return accumulator;
  }, {} as AudioBufferMap);
}

interface StepSequencerState {
  audioBuffers: AudioBufferMap;
  currentStepRef: RefObject<number>;
  drumState: DrumState;
  handleTempoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  instrumentRows: readonly TrackLabel[];
  isPlaying: boolean;
  samplesLoaded: boolean;
  sampleNames: Record<TrackLabel, string>;
  stepCount: number;
  steps: boolean[];
  tempo: number;
  togglePlayback: () => void;
  toggleStep: (track: TrackLabel, stepNumber: number) => void;
}

export function useStepSequencer(): StepSequencerState {
  const [tempo, setTempo] = useState(123);
  const [drumState, setDrumState] = useState<DrumState>(instruments);
  const [sampleNames] = useState(DEFAULT_SAMPLE_NAMES);
  const [isPlaying, setIsPlaying] = useState(false);
  const [samplesLoaded, setSamplesLoaded] = useState(false);
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

  function toggleStep(track: TrackLabel, stepNumber: number) {
    setDrumState((previousState) => {
      const nextState = clonePatternState(previousState);
      const { activeSteps } = nextState[track];
      if (activeSteps.has(stepNumber)) {
        activeSteps.delete(stepNumber);
      } else {
        activeSteps.add(stepNumber);
      }
      return nextState;
    });
  }

  return {
    audioBuffers: audioBufferRefs.current,
    currentStepRef,
    drumState,
    handleTempoChange,
    instrumentRows,
    isPlaying,
    samplesLoaded,
    sampleNames,
    stepCount: STEP_COUNT,
    steps: STEP_GRID,
    tempo,
    togglePlayback,
    toggleStep,
  };
}
