export async function fetchDecodeSample(path, audioContextRef) {
  const result = await fetch(path);
  const arrayBuffer = await result.arrayBuffer();
  return audioContextRef.current.decodeAudioData(arrayBuffer);
}

export async function loadSamples({ audioContextRef, audioBufferRefs, drumStateRef }) {
  for (const [sampleType, buffer] of Object.entries(
    audioBufferRefs.current,
  )) {
    if (buffer) {
      return;
    }
    audioBufferRefs.current = {
      ...audioBufferRefs.current,
      [sampleType]: await fetchDecodeSample(
        drumStateRef.current[sampleType].path,
        audioContextRef,
      ),
    };
  }
}

export async function initDrumMachine({ audioContextRef, audioBufferRefs, drumStateRef }) {
  if (!audioContextRef.current) {
    audioContextRef.current = new AudioContext();
    await loadSamples({ audioContextRef, audioBufferRefs, drumStateRef });
  }
}
