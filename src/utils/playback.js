export function nextNote({
  nextNoteTime,
  currentStep,
  secondsPerStep,
  stepCount,
}) {
  nextNoteTime.current = nextNoteTime.current + secondsPerStep;
  currentStep.current = (currentStep.current + 1) % stepCount;
}

export function handleBPM(event, setTempo) {
  setTempo(parseInt(event.target.value, 10));
}

export function handlePatternChange(event, type, setDrumState) {
  const stepNumber = Number(event.target.value);
  setDrumState((previousState) => {
    const nextState = structuredClone(previousState);
    const { activeSteps } = nextState[type];
    if (activeSteps.has(stepNumber)) {
      activeSteps.delete(stepNumber);
    } else {
      activeSteps.add(stepNumber);
    }
    return nextState;
  });
}

export function handleStart({
  audioContextRef,
  isPlaying,
  setIsPlaying,
  nextNoteTime,
  secondsPerStep,
  stopPlayback,
}) {
  const context = audioContextRef.current;
  if (!context) {
    return;
  }

  if (isPlaying) {
    stopPlayback();
    setIsPlaying(false);
    return;
  }

  nextNoteTime.current = context.currentTime;
  if (context.state === "suspended") {
    context.resume();
  }
  setIsPlaying(true);
}

export function stopPlayback(audioContextRef) {
  if (audioContextRef.current) {
    audioContextRef.current.suspend();
  }
}

export function triggerSample(
  { drumStateRef, audioBufferRefs, audioContextRef },
  currentStepRef,
  time,
) {
  for (const sampleType in drumStateRef.current) {
    const { activeSteps } = drumStateRef.current[sampleType];
    if (activeSteps.has(currentStepRef.current)) {
      const audioBuffer = audioBufferRefs.current[sampleType];
      const source = new AudioBufferSourceNode(audioContextRef.current);
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(time);
    }
  }
}

export function updateActiveStep(index, type, drumState) {
  let className = "step";
  const targetRow = drumState[type];
  if (targetRow.activeSteps.has(index)) {
    className = `${className} active`;
  }
  return className;
}

export function scheduler({
  audioContextRef,
  nextNoteTime,
  currentStep,
  secondsPerStep,
  stepCount,
  sequencerClockId,
  LOOKAHEAD_MS,
  SCHEDULE_AHEAD_SECONDS,
  triggerSampleFn,
}) {
  function loop() {
    if (!audioContextRef.current) {
      return;
    }
    while (
      nextNoteTime.current <
      audioContextRef.current.currentTime + SCHEDULE_AHEAD_SECONDS
    ) {
      triggerSampleFn(currentStep, nextNoteTime.current);
      nextNote({
        nextNoteTime,
        currentStep,
        secondsPerStep,
        stepCount,
      });
    }
    sequencerClockId.current = setTimeout(loop, LOOKAHEAD_MS);
  }

  loop();
}
