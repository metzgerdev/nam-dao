import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type {
  AudioBufferMap,
  DrumState,
  InstrumentName,
} from "../data/instruments";

interface NumberRef {
  current: number;
}

interface AudioContextRef {
  current: AudioContext | null;
}

interface DrumStateRef {
  current: DrumState;
}

interface AudioBufferRefs {
  current: AudioBufferMap;
}

interface TimeoutRef {
  current: ReturnType<typeof setTimeout> | null;
}

interface NoteContext {
  nextNoteTimeRef: NumberRef;
  currentStepRef: NumberRef;
  secondsPerStep: number;
  stepCount: number;
}

interface StartContext {
  audioContextRef: AudioContextRef;
  isPlaying: boolean;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  nextNoteTimeRef: NumberRef;
  stopPlayback: () => void;
}

interface SchedulerContext extends NoteContext {
  audioContextRef: AudioContextRef;
  sequencerClockId: TimeoutRef;
  drumStateRef: DrumStateRef;
  audioBufferRefs: AudioBufferRefs;
  LOOKAHEAD_MS: number;
  SCHEDULE_AHEAD_SECONDS: number;
}

function triggerSample(
  {
    drumStateRef,
    audioBufferRefs,
    audioContextRef,
  }: Pick<
    SchedulerContext,
    "audioBufferRefs" | "audioContextRef" | "drumStateRef"
  >,
  currentStepRef: NumberRef,
  time: number,
): void {
  for (const sampleType of Object.keys(
    drumStateRef.current,
  ) as InstrumentName[]) {
    const { activeSteps } = drumStateRef.current[sampleType];
    if (activeSteps.has(currentStepRef.current)) {
      const audioBuffer = audioBufferRefs.current[sampleType];
      if (!audioBuffer || !audioContextRef.current) {
        continue;
      }
      const source = new AudioBufferSourceNode(audioContextRef.current);
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(time);
    }
  }
}

export function nextNote({
  nextNoteTimeRef,
  currentStepRef,
  secondsPerStep,
  stepCount,
}: NoteContext): void {
  nextNoteTimeRef.current = nextNoteTimeRef.current + secondsPerStep;
  currentStepRef.current = (currentStepRef.current + 1) % stepCount;
}

export function handleBPM(
  event: ChangeEvent<HTMLInputElement>,
  setTempo: Dispatch<SetStateAction<number>>,
): void {
  setTempo(parseInt(event.target.value, 10));
}

export function handleStart({
  audioContextRef,
  isPlaying,
  setIsPlaying,
  nextNoteTimeRef,
  stopPlayback,
}: StartContext): void {
  const context = audioContextRef.current;
  if (!context) {
    return;
  }

  if (isPlaying) {
    stopPlayback();
    setIsPlaying(false);
    return;
  }

  nextNoteTimeRef.current = context.currentTime;
  if (context.state === "suspended") {
    context.resume();
  }
  setIsPlaying(true);
}

export function stopPlayback(audioContextRef: AudioContextRef): void {
  audioContextRef.current?.suspend();
}

export function updateActiveStep(
  index: number,
  type: InstrumentName,
  drumState: DrumState,
): string {
  let className = "step";
  const targetRow = drumState[type];
  if (targetRow.activeSteps.has(index)) {
    className = `${className} active`;
  }
  return className;
}

export function scheduler({
  audioContextRef,
  nextNoteTimeRef,
  currentStepRef,
  secondsPerStep,
  stepCount,
  sequencerClockId,
  drumStateRef,
  audioBufferRefs,
  LOOKAHEAD_MS,
  SCHEDULE_AHEAD_SECONDS,
}: SchedulerContext): void {
  function loop() {
    if (!audioContextRef.current) {
      return;
    }
    while (
      nextNoteTimeRef.current <
      audioContextRef.current.currentTime + SCHEDULE_AHEAD_SECONDS
    ) {
      triggerSample(
        { drumStateRef, audioBufferRefs, audioContextRef },
        currentStepRef,
        nextNoteTimeRef.current,
      );
      nextNote({
        nextNoteTimeRef,
        currentStepRef,
        secondsPerStep,
        stepCount,
      });
    }
    sequencerClockId.current = setTimeout(loop, LOOKAHEAD_MS);
  }

  loop();
}
