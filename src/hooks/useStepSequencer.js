import { useEffect, useRef, useState } from "react";
import { instrumentRows, instruments } from "../data/instruments";
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

function clonePatternState(previousState) {
  return structuredClone(previousState);
}

export function useStepSequencer() {
  const [tempo, setTempo] = useState(123);
  const [drumState, setDrumState] = useState(instruments);
  const [isPlaying, setIsPlaying] = useState(false);
  const [samplesLoaded, setSamplesLoaded] = useState(false);
  const secondsPerStep = 60 / tempo / 4;
  const drumStateRef = useRef(instruments);
  const audioContextRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const sequencerClockId = useRef(null);
  const audioBufferRefs = useRef(
    instrumentRows.reduce((accumulator, instrument) => {
      accumulator[instrument] = null;
      return accumulator;
    }, {}),
  );

  useEffect(() => {
    let isMounted = true;

    async function bootDrumMachine() {
      await initDrumMachine({ audioContextRef, audioBufferRefs, drumStateRef });
      if (isMounted) {
        setSamplesLoaded(true);
      }
    }

    bootDrumMachine();

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
      clearTimeout(sequencerClockId.current);
      sequencerClockId.current = null;
    };
  }, [isPlaying, secondsPerStep]);

  function handleTempoChange(event) {
    handleBPM(event, setTempo);
  }

  function togglePlayback() {
    handleStart({
      audioContextRef,
      isPlaying,
      setIsPlaying,
      secondsPerStep,
      nextNoteTimeRef,
      stopPlayback: () => stopPlayback(audioContextRef),
    });
  }

  function toggleStep(type, stepNumber) {
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
  }

  return {
    audioBuffers: audioBufferRefs.current,
    currentStepRef,
    drumState,
    handleTempoChange,
    isPlaying,
    instrumentRows,
    samplesLoaded,
    setDrumState,
    stepCount: STEP_COUNT,
    steps: STEP_GRID,
    tempo,
    togglePlayback,
    toggleStep,
  };
}
