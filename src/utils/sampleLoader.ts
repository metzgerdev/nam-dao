import type { AudioBufferMap, DrumState } from "../data/instruments";

let sharedAudioContext: AudioContext | null = null;
let sharedSampleBank: AudioBufferMap | null = null;
let sharedSampleBankPromise: Promise<AudioBufferMap> | null = null;

interface AudioContextRef {
  current: AudioContext | null;
}

interface AudioBufferRefs {
  current: AudioBufferMap;
}

interface DrumStateRef {
  current: DrumState;
}

interface LoaderContext {
  audioContextRef: AudioContextRef;
  drumStateRef: DrumStateRef;
}

interface DrumMachineContext extends LoaderContext {
  audioBufferRefs: AudioBufferRefs;
}

export async function fetchDecodeSample(
  path: string,
  audioContextRef: AudioContextRef,
): Promise<AudioBuffer> {
  const result = await fetch(path);
  const arrayBuffer = await result.arrayBuffer();
  return audioContextRef.current!.decodeAudioData(arrayBuffer);
}

function createAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContext();
  }

  return sharedAudioContext;
}

async function decodeSampleBank({
  audioContextRef,
  drumStateRef,
}: LoaderContext): Promise<AudioBufferMap> {
  const sampleEntries = await Promise.all(
    Object.entries(drumStateRef.current).map(
      async ([sampleType, sampleConfig]) => {
        const audioBuffer = await fetchDecodeSample(
          sampleConfig.path,
          audioContextRef,
        );
        return [sampleType, audioBuffer] as const;
      },
    ),
  );

  return Object.fromEntries(sampleEntries) as AudioBufferMap;
}

export async function loadSamples({
  audioContextRef,
  drumStateRef,
}: LoaderContext): Promise<AudioBufferMap> {
  if (sharedSampleBank) {
    return sharedSampleBank;
  }

  if (!sharedSampleBankPromise) {
    sharedSampleBankPromise = decodeSampleBank({
      audioContextRef,
      drumStateRef,
    }).then((sampleBank) => {
      sharedSampleBank = sampleBank;
      return sampleBank;
    });
  }

  return sharedSampleBankPromise;
}

export async function initDrumMachine({
  audioContextRef,
  audioBufferRefs,
  drumStateRef,
}: DrumMachineContext): Promise<AudioBufferMap> {
  if (!audioContextRef.current) {
    audioContextRef.current = createAudioContext();
  }

  const sampleBank = await loadSamples({ audioContextRef, drumStateRef });
  audioBufferRefs.current = sampleBank;
  return sampleBank;
}

export function resetSampleCacheForTests(): void {
  sharedAudioContext = null;
  sharedSampleBank = null;
  sharedSampleBankPromise = null;
}
