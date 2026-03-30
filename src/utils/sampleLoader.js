let sharedAudioContext = null;
let sharedSampleBank = null;
let sharedSampleBankPromise = null;

export async function fetchDecodeSample(path, audioContextRef) {
  const result = await fetch(path);
  const arrayBuffer = await result.arrayBuffer();
  return audioContextRef.current.decodeAudioData(arrayBuffer);
}

function createAudioContext() {
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContext();
  }

  return sharedAudioContext;
}

async function decodeSampleBank({ audioContextRef, drumStateRef }) {
  const sampleEntries = await Promise.all(
    Object.entries(drumStateRef.current).map(async ([sampleType, sampleConfig]) => {
      const audioBuffer = await fetchDecodeSample(sampleConfig.path, audioContextRef);
      return [sampleType, audioBuffer];
    }),
  );

  return Object.fromEntries(sampleEntries);
}

export async function loadSamples({ audioContextRef, drumStateRef }) {
  if (sharedSampleBank) {
    return sharedSampleBank;
  }

  if (!sharedSampleBankPromise) {
    sharedSampleBankPromise = decodeSampleBank({ audioContextRef, drumStateRef }).then(
      (sampleBank) => {
        sharedSampleBank = sampleBank;
        return sampleBank;
      },
    );
  }

  return sharedSampleBankPromise;
}

export async function initDrumMachine({
  audioContextRef,
  audioBufferRefs,
  drumStateRef,
}) {
  if (!audioContextRef.current) {
    audioContextRef.current = createAudioContext();
  }

  const sampleBank = await loadSamples({ audioContextRef, drumStateRef });
  audioBufferRefs.current = sampleBank;
  return sampleBank;
}

export function resetSampleCacheForTests() {
  sharedAudioContext = null;
  sharedSampleBank = null;
  sharedSampleBankPromise = null;
}
